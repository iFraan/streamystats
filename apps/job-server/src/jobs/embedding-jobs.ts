import { db, Item, items, servers } from "@streamystats/database";
import axios from "axios";
import { and, eq, sql } from "drizzle-orm";
import OpenAI from "openai";
import { TIMEOUT_CONFIG } from "./config";
import { logJobResult } from "./job-logger";
import { getJobQueue } from "./queue";
import { sleep } from "../utils/sleep";
import type { PgBossJob } from "../types/job-status";

// Embedding configuration passed from job data
interface EmbeddingConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  dimensions: number;
}

// Job data for embedding generation
interface GenerateItemEmbeddingsJobData {
  serverId: number;
  provider: "openai-compatible" | "openai" | "ollama";
  config: EmbeddingConfig;
  manualStart?: boolean;
}

// Default config values
const DEFAULT_MAX_TEXT_LENGTH = 8000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RATE_LIMIT_DELAY = 500;

// Track if index has been ensured this session (per dimension)
const indexEnsuredForDimension = new Set<number>();

/**
 * Clear the in-memory embedding index cache.
 * Call this when embeddings are cleared to ensure the index
 * is properly recreated on next embedding generation.
 */
export function clearEmbeddingIndexCache(): void {
  indexEnsuredForDimension.clear();
}

/**
 * Ensure HNSW index exists for the given embedding dimension.
 * pgvector requires indexes to be created with a specific dimension.
 * This creates the index if it doesn't exist, improving similarity query performance.
 * Note: HNSW index max is 2000 dimensions - for larger dimensions, queries work without index.
 */
async function ensureEmbeddingIndex(dimensions: number): Promise<void> {
  // Skip if already ensured this session
  if (indexEnsuredForDimension.has(dimensions)) {
    return;
  }

  // pgvector HNSW index has a max of 2000 dimensions
  // For larger dimensions, skip index - queries still work via sequential scan
  if (dimensions > 2000) {
    console.info(
      `[embeddings-index] dimensions=${dimensions} action=skip reason=exceedsMaxDimensions maxDimensions=2000`
    );
    // Drop any existing index with different dimensions
    await db.execute(sql`DROP INDEX IF EXISTS items_embedding_idx`);
    indexEnsuredForDimension.add(dimensions);
    return;
  }

  try {
    // Check if an index exists and get its definition
    const existingIndex = await db.execute<{
      indexname: string;
      indexdef: string;
    }>(sql`
      SELECT indexname, indexdef FROM pg_indexes 
      WHERE tablename = 'items' 
      AND indexname = 'items_embedding_idx'
    `);

    if (existingIndex.length > 0) {
      const indexDef = existingIndex[0].indexdef;
      // Check if the existing index matches our dimensions
      const dimensionMatch = indexDef.match(/vector\((\d+)\)/);
      if (dimensionMatch && parseInt(dimensionMatch[1]) === dimensions) {
        // Index exists with correct dimensions
        indexEnsuredForDimension.add(dimensions);
        return;
      }
      // Index exists but with different dimensions - need to recreate
      console.info(
        `[embeddings-index] dimensions=${dimensions} action=dropExisting reason=dimensionMismatch`
      );
      await db.execute(sql`DROP INDEX IF EXISTS items_embedding_idx`);
    }

    // Create HNSW index for cosine similarity
    // The cast to vector(N) allows the index to work with our variable-dimension column
    console.info(
      `[embeddings-index] dimensions=${dimensions} action=create method=hnsw metric=cosine`
    );
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS items_embedding_idx 
      ON items 
      USING hnsw ((embedding::vector(${sql.raw(
        String(dimensions)
      )})) vector_cosine_ops)
    `);
    console.info(
      `[embeddings-index] dimensions=${dimensions} action=created method=hnsw metric=cosine`
    );
    indexEnsuredForDimension.add(dimensions);
  } catch (error) {
    // Log but don't fail - queries will work, just slower
    console.warn("Could not create embedding index:", error);
  }
}

// Job: Generate embeddings for media items using different providers
export async function generateItemEmbeddingsJob(
  job: PgBossJob<GenerateItemEmbeddingsJobData>,
) {
  const startTime = Date.now();
  const {
    serverId,
    provider: rawProvider,
    config,
    manualStart = false, // If true, continue until complete even if auto-embeddings is disabled
  } = job.data;

  // Normalize legacy "openai" provider to "openai-compatible"
  const provider = rawProvider === "openai" ? "openai-compatible" : rawProvider;
  let lastHeartbeat = Date.now();

  try {
    // Validate provider early
    if (!provider) {
      throw new Error(
        "Embedding provider not configured. Please configure it in server settings."
      );
    }

    if (!config.baseUrl || !config.model) {
      throw new Error(
        "Embedding configuration incomplete. Base URL and model are required."
      );
    }

    const serverMeta = await db
      .select({ name: servers.name })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);
    const serverName = serverMeta[0]?.name ?? String(serverId);

    console.info(
      `[embeddings] server=${serverName} serverId=${serverId} action=start provider=${provider} model=${config.model} baseUrl=${config.baseUrl}`
    );

    // Update job status to processing
    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "processing",
      { serverId, provider, status: "starting" },
      Date.now() - startTime
    );

    // Get unprocessed items (Movies and Series) for this server
    const unprocessedItems = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.serverId, serverId),
          eq(items.processed, false),
          sql`${items.type} IN ('Movie', 'Series')`
        )
      )
      .limit(100); // Process in batches

    if (unprocessedItems.length === 0) {
      await logJobResult(
        job.id,
        "generate-item-embeddings",
        "completed",
        { serverId, provider, processed: 0, message: "No items to process" },
        Date.now() - startTime
      );
      return { success: true, processed: 0 };
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Helper function to send heartbeat every 30 seconds
    const sendHeartbeat = async () => {
      const now = Date.now();
      if (now - lastHeartbeat > 30000) {
        // 30 seconds
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=heartbeat processed=${processedCount} total=${unprocessedItems.length} skipped=${skippedCount} errors=${errorCount}`
        );
        lastHeartbeat = now;
      }
    };

    // Helper function to prepare text for embedding
    const prepareTextForEmbedding = (item: Item): string => {
      const parts: string[] = [];

      // 1. Core Metadata
      parts.push(`Title: ${item.name}`);

      if (item.originalTitle && item.originalTitle !== item.name) {
        parts.push(`Original Title: ${item.originalTitle}`);
      }

      if (item.seriesName) {
        parts.push(`Series: ${item.seriesName}`);
      }

      if (item.type) {
        parts.push(`Type: ${item.type}`);
      }

      // 2. Descriptive Content
      if (item.overview) {
        parts.push(`Overview: ${item.overview}`);
      }

      if (item.genres && item.genres.length > 0) {
        parts.push(`Genres: ${item.genres.join(", ")}`);
      }

      if (item.tags && item.tags.length > 0) {
        parts.push(`Tags: ${item.tags.join(", ")}`);
      }

      // 3. Technical & Release Info
      if (item.productionYear) {
        parts.push(`Year: ${item.productionYear}`);
      }

      if (item.premiereDate) {
        try {
          const date = new Date(item.premiereDate).toISOString().split("T")[0];
          parts.push(`Premiere: ${date}`);
        } catch (e) {
          // Ignore invalid dates
        }
      }

      if (item.officialRating) {
        parts.push(`Rating: ${item.officialRating}`);
      }

      if (item.communityRating) {
        parts.push(`Community Rating: ${item.communityRating}`);
      }

      if (item.seriesStudio) {
        parts.push(`Studio: ${item.seriesStudio}`);
      }

      if (item.runtimeTicks) {
        // Convert ticks to minutes (1 tick = 100 nanoseconds; 10,000,000 ticks = 1 second)
        const minutes = Math.round(item.runtimeTicks / 10000000 / 60);
        if (minutes > 0) {
          parts.push(`Runtime: ${minutes} minutes`);
        }
      }

      // 4. People (Grouped by role for better context)
      if (item.people) {
        try {
          type PersonData = {
            Name?: string;
            Role?: string;
            Type?: string;
          };

          const peopleData =
            typeof item.people === "string"
              ? (JSON.parse(item.people) as Record<string, PersonData>)
              : (item.people as Record<string, PersonData>);

          if (peopleData && typeof peopleData === "object") {
            const people = Object.values(peopleData).filter(
              (p): p is PersonData =>
                !!p && typeof p === "object" && !!p.Name,
            );

            const directors = people
              .filter((p) => p.Type === "Director")
              .map((p) => p.Name);

            const cast = people
              .filter((p) => p.Type === "Actor")
              .map((p) => `${p.Name}${p.Role ? ` as ${p.Role}` : ""}`);

            // Capture writers, producers, etc.
            const crew = people
              .filter((p) => p.Type !== "Director" && p.Type !== "Actor")
              .map((p) => `${p.Name} (${p.Type || "Crew"})`);

            if (directors.length > 0) {
              parts.push(`Directors: ${directors.join(", ")}`);
            }
            if (cast.length > 0) {
              // Limit cast to top 15 to save tokens/avoid dilution
              parts.push(`Cast: ${cast.slice(0, 15).join(", ")}`);
            }
            if (crew.length > 0) {
              parts.push(`Crew: ${crew.slice(0, 10).join(", ")}`);
            }
          }
        } catch (error) {
          console.warn(
            `Failed to parse people data for item ${item.id}:`,
            error,
          );
        }
      }

      // Join with newlines to clearly separate semantic sections
      return parts.join("\n").substring(0, DEFAULT_MAX_TEXT_LENGTH);
    };

    const expectedDimensions = config.dimensions;
    let dimensionMismatchDetected = false;
    let actualDimensions = 0;

    // Validate embedding dimensions match expected
    // On first mismatch, we'll throw an error to fail fast
    const validateEmbedding = (
      rawEmbedding: number[],
      itemId: string
    ): number[] | null => {
      if (!Array.isArray(rawEmbedding) || rawEmbedding.length === 0) {
        console.error(`Invalid embedding data for item ${itemId}`);
        return null;
      }

      if (rawEmbedding.length !== expectedDimensions) {
        if (!dimensionMismatchDetected) {
          dimensionMismatchDetected = true;
          actualDimensions = rawEmbedding.length;
          // Throw error on first mismatch to fail fast with clear message
          throw new Error(
            `Dimension mismatch: model outputs ${rawEmbedding.length} dimensions, but configured for ${expectedDimensions}. ` +
              `Update your dimension setting to ${rawEmbedding.length} to match the model output, or use a different model. ` +
              `Note: Most embedding models have fixed output dimensions that cannot be changed via configuration.`
          );
        }
        return null;
      }

      return rawEmbedding;
    };

    if (provider === "openai-compatible") {
      // Use OpenAI SDK with custom baseURL for any OpenAI-compatible API
      // Supports: OpenAI, Azure OpenAI, Together AI, Fireworks, Anyscale, LocalAI, LM Studio, vLLM, etc.
      if (!config.apiKey) {
        throw new Error("API key not provided for OpenAI-compatible provider");
      }

      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
        timeout: TIMEOUT_CONFIG.DEFAULT,
        maxRetries: DEFAULT_MAX_RETRIES,
      });

      // Process items in batches
      const BATCH_SIZE = 20;

      for (let i = 0; i < unprocessedItems.length; i += BATCH_SIZE) {
        const batch = unprocessedItems.slice(i, i + BATCH_SIZE);

        try {
          await sendHeartbeat();

          const batchData: { item: Item; textToEmbed: string }[] = [];
          const itemsToSkip: Item[] = [];

          for (const item of batch) {
            const textToEmbed = prepareTextForEmbedding(item);
            if (textToEmbed.trim()) {
              batchData.push({ item, textToEmbed });
            } else {
              itemsToSkip.push(item);
            }
          }

          if (itemsToSkip.length > 0) {
            for (const item of itemsToSkip) {
              await db
                .update(items)
                .set({ processed: true })
                .where(eq(items.id, item.id));
              skippedCount++;
            }
          }

          if (batchData.length === 0) {
            continue;
          }

          const textsToEmbed = batchData.map((data) => data.textToEmbed);

          console.info(
            `[embeddings] server=${serverName} serverId=${serverId} action=batch batchIndex=${Math.floor(
              i / BATCH_SIZE
            )} batchItems=${batchData.length} model=${config.model} baseUrl=${
              config.baseUrl
            }`
          );

          // Call embedding API
          // Note: 'dimensions' param only works for models that support it (e.g., OpenAI text-embedding-3-*)
          const response = await client.embeddings.create({
            model: config.model,
            input: textsToEmbed,
            ...(expectedDimensions ? { dimensions: expectedDimensions } : {}),
          });

          if (!response.data || response.data.length !== batchData.length) {
            throw new Error(
              `Invalid response: expected ${batchData.length} embeddings, got ${
                response.data?.length || 0
              }`
            );
          }

          for (let j = 0; j < batchData.length; j++) {
            const { item } = batchData[j];
            const embeddingData = response.data[j];

            if (!embeddingData?.embedding) {
              console.error(`No embedding data for item ${item.id}`);
              errorCount++;
              continue;
            }

            const rawEmbedding = embeddingData.embedding;

            const embedding = validateEmbedding(rawEmbedding, item.id);
            if (!embedding) {
              errorCount++;
              continue;
            }

            try {
              await db
                .update(items)
                .set({
                  embedding,
                  processed: true,
                })
                .where(eq(items.id, item.id));
              processedCount++;
            } catch (dbError) {
              console.error(`Database error for item ${item.id}:`, dbError);
              errorCount++;
            }
          }

          await sleep(DEFAULT_RATE_LIMIT_DELAY);
        } catch (batchError) {
          console.error(`Error processing batch at index ${i}:`, batchError);

          if (batchError instanceof Error) {
            if (batchError.message.includes("rate_limit")) {
              throw new Error("Rate limit exceeded. Please try again later.");
            } else if (batchError.message.includes("insufficient_quota")) {
              throw new Error("Quota exceeded. Please check your billing.");
            } else if (
              batchError.message.includes("invalid_api_key") ||
              batchError.message.includes("401")
            ) {
              throw new Error(
                "Invalid API key. Please check your configuration."
              );
            }
          }

          errorCount += batch.length;
          continue;
        }
      }
    } else if (provider === "ollama") {
      // Ollama uses a different API format (/api/embeddings)
      for (const item of unprocessedItems) {
        try {
          await sendHeartbeat();

          const textToEmbed = prepareTextForEmbedding(item);

          if (!textToEmbed.trim()) {
            await db
              .update(items)
              .set({ processed: true })
              .where(eq(items.id, item.id));
            skippedCount++;
            continue;
          }

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (config.apiKey) {
            headers["Authorization"] = `Bearer ${config.apiKey}`;
          }

          const response = await axios.post(
            `${config.baseUrl}/api/embeddings`,
            {
              model: config.model,
              prompt: textToEmbed,
            },
            {
              headers,
              timeout: TIMEOUT_CONFIG.DEFAULT,
            }
          );

          const rawEmbedding =
            response.data.embedding || response.data.embeddings;

          if (!rawEmbedding) {
            throw new Error("No embedding returned from Ollama");
          }

          const embedding = validateEmbedding(rawEmbedding, item.id);
          if (!embedding) {
            errorCount++;
            continue;
          }

          await db
            .update(items)
            .set({
              embedding,
              processed: true,
            })
            .where(eq(items.id, item.id));

          processedCount++;

          // Ollama is typically self-hosted, use shorter delay
          await sleep(100);
        } catch (itemError) {
          console.error(`Error processing item ${item.id}:`, itemError);
          errorCount++;
          continue;
        }
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const processingTime = Date.now() - startTime;
    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "completed",
      {
        serverId,
        provider,
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      processingTime
    );

    // Ensure HNSW index exists for similarity queries (only on first batch)
    if (processedCount > 0) {
      await ensureEmbeddingIndex(config.dimensions);
    }

    // Check if there are more items to process using an efficient count query
    const remainingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(
        and(
          eq(items.serverId, serverId),
          eq(items.processed, false),
          sql`${items.type} IN ('Movie', 'Series')`
        )
      );

    const remaining = Number(remainingCount[0]?.count ?? 0);

    if (remaining > 0) {
      // Check if we should continue: either manual start or auto-embeddings enabled
      const serverCheck = await db
        .select({ autoGenerateEmbeddings: servers.autoGenerateEmbeddings })
        .from(servers)
        .where(eq(servers.id, serverId))
        .limit(1);

      const autoEnabled = serverCheck[0]?.autoGenerateEmbeddings === true;
      const shouldContinue = manualStart || autoEnabled;

      if (!shouldContinue) {
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=skipQueueNextBatch remaining=${remaining} manual=${manualStart} auto=${autoEnabled} reason=autoDisabled`
        );
      } else {
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=queueNextBatch remaining=${remaining} manual=${manualStart} auto=${autoEnabled}`
        );

        // Queue next batch (no singleton - chained jobs need to run sequentially)
        try {
          const boss = await getJobQueue();
          const nextJobId = await boss.send(
            "generate-item-embeddings",
            {
              serverId,
              provider,
              config,
              manualStart, // Preserve the manual start flag for subsequent batches
            },
            {
              retryLimit: 3,
              retryDelay: 30, // 30 seconds
            }
          );

          console.info(
            `[embeddings] server=${serverName} serverId=${serverId} action=queuedNextBatch jobId=${nextJobId}`
          );
        } catch (queueError) {
          console.error("Failed to queue next embedding batch:", queueError);
        }
      }
    } else {
      console.info(
        `[embeddings] server=${serverName} serverId=${serverId} action=completed processed=${processedCount} skipped=${skippedCount} errors=${errorCount}`
      );

      // Revalidate recommendations cache since embeddings have changed
      try {
        const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";
        await axios.post(`${nextjsUrl}/api/revalidate-recommendations`, {
          serverId,
        });
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=revalidatedRecommendationsCache`
        );
      } catch (revalidateError) {
        console.warn(
          "Failed to revalidate recommendations cache:",
          revalidateError
        );
      }
    }

    return {
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      errors: errorCount,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Embedding job failed for server ${serverId}:`, error);

    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "failed",
      {
        serverId,
        provider,
        error: error instanceof Error ? error.message : String(error),
      },
      processingTime,
      error
    );
    throw error;
  }
}
