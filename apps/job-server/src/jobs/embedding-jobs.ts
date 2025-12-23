import { db, Item, items, servers } from "@streamystats/database";
import axios from "axios";
import { and, eq, sql } from "drizzle-orm";
import OpenAI from "openai";
import { TIMEOUT_CONFIG } from "./config";
import { logJobResult } from "./job-logger";
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
const ITEMS_PER_BATCH = 100; // Items to fetch from DB at a time
const API_BATCH_SIZE = 20; // Items to send to embedding API at once

// Track if index has been ensured this session (per dimension)
const indexEnsuredForDimension = new Set<number>();

/**
 * Check if stop has been requested for a server.
 * Uses the embeddingStopRequested field on the servers table.
 */
async function isStopRequested(serverId: number): Promise<boolean> {
  const result = await db
    .select({ stopRequested: servers.embeddingStopRequested })
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);
  return result[0]?.stopRequested === true;
}

/**
 * Clear the stop flag for a server.
 * Called when starting embeddings.
 */
export async function clearStopFlag(serverId: number): Promise<void> {
  await db
    .update(servers)
    .set({ embeddingStopRequested: false })
    .where(eq(servers.id, serverId));
}

/**
 * Set the stop flag for a server.
 * The running job will check this and stop.
 */
export async function setStopFlag(serverId: number): Promise<void> {
  await db
    .update(servers)
    .set({ embeddingStopRequested: true })
    .where(eq(servers.id, serverId));
}

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
 */
async function ensureEmbeddingIndex(dimensions: number): Promise<void> {
  if (indexEnsuredForDimension.has(dimensions)) {
    return;
  }

  // pgvector HNSW index has a max of 2000 dimensions
  if (dimensions > 2000) {
    console.info(
      `[embeddings-index] dimensions=${dimensions} action=skip reason=exceedsMaxDimensions`
    );
    await db.execute(sql`DROP INDEX IF EXISTS items_embedding_idx`);
    indexEnsuredForDimension.add(dimensions);
    return;
  }

  try {
    const existingIndex = await db.execute<{
      indexname: string;
      indexdef: string;
    }>(sql`
      SELECT indexname, indexdef FROM pg_indexes 
      WHERE tablename = 'items' AND indexname = 'items_embedding_idx'
    `);

    if (existingIndex.length > 0) {
      const indexDef = existingIndex[0].indexdef;
      const dimensionMatch = indexDef.match(/vector\((\d+)\)/);
      if (dimensionMatch && parseInt(dimensionMatch[1]) === dimensions) {
        indexEnsuredForDimension.add(dimensions);
        return;
      }
      console.info(
        `[embeddings-index] dimensions=${dimensions} action=dropExisting reason=dimensionMismatch`
      );
      await db.execute(sql`DROP INDEX IF EXISTS items_embedding_idx`);
    }

    console.info(
      `[embeddings-index] dimensions=${dimensions} action=create method=hnsw`
    );
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS items_embedding_idx 
      ON items 
      USING hnsw ((embedding::vector(${sql.raw(String(dimensions))})) vector_cosine_ops)
    `);
    indexEnsuredForDimension.add(dimensions);
  } catch (error) {
    console.warn("Could not create embedding index:", error);
  }
}

/**
 * Prepare item text for embedding.
 */
function prepareTextForEmbedding(item: Item): string {
  const parts: string[] = [];

  parts.push(`Title: ${item.name}`);
  if (item.originalTitle && item.originalTitle !== item.name) {
    parts.push(`Original Title: ${item.originalTitle}`);
  }
  if (item.seriesName) parts.push(`Series: ${item.seriesName}`);
  if (item.type) parts.push(`Type: ${item.type}`);
  if (item.overview) parts.push(`Overview: ${item.overview}`);
  if (item.genres?.length) parts.push(`Genres: ${item.genres.join(", ")}`);
  if (item.tags?.length) parts.push(`Tags: ${item.tags.join(", ")}`);
  if (item.productionYear) parts.push(`Year: ${item.productionYear}`);

  if (item.premiereDate) {
    try {
      const date = new Date(item.premiereDate).toISOString().split("T")[0];
      parts.push(`Premiere: ${date}`);
    } catch {
      // Ignore invalid dates
    }
  }

  if (item.officialRating) parts.push(`Rating: ${item.officialRating}`);
  if (item.communityRating)
    parts.push(`Community Rating: ${item.communityRating}`);
  if (item.seriesStudio) parts.push(`Studio: ${item.seriesStudio}`);

  if (item.runtimeTicks) {
    const minutes = Math.round(item.runtimeTicks / 10000000 / 60);
    if (minutes > 0) parts.push(`Runtime: ${minutes} minutes`);
  }

  if (item.people) {
    try {
      type PersonData = { Name?: string; Role?: string; Type?: string };
      const peopleData =
        typeof item.people === "string"
          ? (JSON.parse(item.people) as Record<string, PersonData>)
          : (item.people as Record<string, PersonData>);

      if (peopleData && typeof peopleData === "object") {
        const people = Object.values(peopleData).filter(
          (p): p is PersonData => !!p && typeof p === "object" && !!p.Name
        );

        const directors = people
          .filter((p) => p.Type === "Director")
          .map((p) => p.Name);
        const cast = people
          .filter((p) => p.Type === "Actor")
          .map((p) => `${p.Name}${p.Role ? ` as ${p.Role}` : ""}`);
        const crew = people
          .filter((p) => p.Type !== "Director" && p.Type !== "Actor")
          .map((p) => `${p.Name} (${p.Type || "Crew"})`);

        if (directors.length) parts.push(`Directors: ${directors.join(", ")}`);
        if (cast.length) parts.push(`Cast: ${cast.slice(0, 15).join(", ")}`);
        if (crew.length) parts.push(`Crew: ${crew.slice(0, 10).join(", ")}`);
      }
    } catch {
      // Ignore parse errors
    }
  }

  return parts.join("\n").substring(0, DEFAULT_MAX_TEXT_LENGTH);
}

/**
 * Process a batch of items using OpenAI-compatible API.
 */
async function processOpenAIBatch(
  client: OpenAI,
  batchItems: Item[],
  config: EmbeddingConfig,
  validateEmbedding: (raw: number[], itemId: string) => number[] | null
): Promise<{ processed: number; skipped: number; errors: number }> {
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  const batchData: { item: Item; text: string }[] = [];
  const toSkip: Item[] = [];

  for (const item of batchItems) {
    const text = prepareTextForEmbedding(item);
    if (text.trim()) {
      batchData.push({ item, text });
    } else {
      toSkip.push(item);
    }
  }

  // Mark items with no text as processed
  for (const item of toSkip) {
    await db
      .update(items)
      .set({ processed: true })
      .where(eq(items.id, item.id));
    skipped++;
  }

  if (batchData.length === 0) {
    return { processed, skipped, errors };
  }

  const texts = batchData.map((d) => d.text);
  const response = await client.embeddings.create({
    model: config.model,
    input: texts,
    ...(config.dimensions ? { dimensions: config.dimensions } : {}),
  });

  if (!response.data || response.data.length !== batchData.length) {
    throw new Error(
      `Invalid response: expected ${batchData.length} embeddings, got ${response.data?.length || 0}`
    );
  }

  for (let j = 0; j < batchData.length; j++) {
    const { item } = batchData[j];
    const embeddingData = response.data[j];

    if (!embeddingData?.embedding) {
      errors++;
      continue;
    }

    const embedding = validateEmbedding(embeddingData.embedding, item.id);
    if (!embedding) {
      errors++;
      continue;
    }

    try {
      await db
        .update(items)
        .set({ embedding, processed: true })
        .where(eq(items.id, item.id));
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, skipped, errors };
}

/**
 * Process a single item using Ollama API.
 */
async function processOllamaItem(
  item: Item,
  config: EmbeddingConfig,
  validateEmbedding: (raw: number[], itemId: string) => number[] | null
): Promise<{ processed: number; skipped: number; errors: number }> {
  const text = prepareTextForEmbedding(item);

  if (!text.trim()) {
    await db
      .update(items)
      .set({ processed: true })
      .where(eq(items.id, item.id));
    return { processed: 0, skipped: 1, errors: 0 };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await axios.post(
    `${config.baseUrl}/api/embeddings`,
    { model: config.model, prompt: text },
    { headers, timeout: TIMEOUT_CONFIG.DEFAULT }
  );

  const rawEmbedding = response.data.embedding || response.data.embeddings;
  if (!rawEmbedding) {
    throw new Error("No embedding returned from Ollama");
  }

  const embedding = validateEmbedding(rawEmbedding, item.id);
  if (!embedding) {
    return { processed: 0, skipped: 0, errors: 1 };
  }

  await db
    .update(items)
    .set({ embedding, processed: true })
    .where(eq(items.id, item.id));
  return { processed: 1, skipped: 0, errors: 0 };
}

/**
 * Main embedding job - single long-running job with internal batching.
 * Checks for stop flag between batches.
 */
export async function generateItemEmbeddingsJob(
  job: PgBossJob<GenerateItemEmbeddingsJobData>
) {
  const startTime = Date.now();
  const { serverId, provider: rawProvider, config, manualStart = false } = job.data;
  const provider = rawProvider === "openai" ? "openai-compatible" : rawProvider;

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let lastHeartbeat = Date.now();
  let stopped = false;

  const serverMeta = await db
    .select({ name: servers.name })
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);
  const serverName = serverMeta[0]?.name ?? String(serverId);

  const sendHeartbeat = async () => {
    const now = Date.now();
    if (now - lastHeartbeat > 30000) {
      console.info(
        `[embeddings] server=${serverName} serverId=${serverId} action=heartbeat processed=${totalProcessed} skipped=${totalSkipped} errors=${totalErrors}`
      );
      lastHeartbeat = now;

      // Update job_results with heartbeat so UI knows job is still alive
      await logJobResult(
        job.id,
        "generate-item-embeddings",
        "processing",
        {
          serverId,
          provider,
          processed: totalProcessed,
          skipped: totalSkipped,
          errors: totalErrors,
          lastHeartbeat: new Date().toISOString(),
        },
        Date.now() - startTime
      );
    }
  };

  try {
    if (!provider) {
      throw new Error("Embedding provider not configured.");
    }
    if (!config.baseUrl || !config.model) {
      throw new Error("Embedding configuration incomplete.");
    }

    console.info(
      `[embeddings] server=${serverName} serverId=${serverId} action=start provider=${provider} model=${config.model}`
    );

    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "processing",
      {
        serverId,
        provider,
        status: "starting",
        lastHeartbeat: new Date().toISOString(),
      },
      0
    );

    // Validate embedding dimensions
    const expectedDimensions = config.dimensions;
    let dimensionMismatchDetected = false;

    const validateEmbedding = (
      raw: number[],
      itemId: string
    ): number[] | null => {
      if (!Array.isArray(raw) || raw.length === 0) {
        console.error(`Invalid embedding for item ${itemId}`);
        return null;
      }
      if (raw.length !== expectedDimensions) {
        if (!dimensionMismatchDetected) {
          dimensionMismatchDetected = true;
          throw new Error(
            `Dimension mismatch: model outputs ${raw.length}, configured for ${expectedDimensions}. ` +
              `Update dimension setting to ${raw.length}.`
          );
        }
        return null;
      }
      return raw;
    };

    // Create OpenAI client if needed
    let openaiClient: OpenAI | null = null;
    if (provider === "openai-compatible") {
      openaiClient = new OpenAI({
        apiKey: config.apiKey || "not-needed",
        baseURL: config.baseUrl,
        timeout: TIMEOUT_CONFIG.DEFAULT,
        maxRetries: DEFAULT_MAX_RETRIES,
      });
    }

    // Main processing loop - fetch and process batches until done or stopped
    while (true) {
      // Check for stop flag at the start of each batch
      if (await isStopRequested(serverId)) {
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=stopped processed=${totalProcessed}`
        );
        stopped = true;
        break;
      }

      // Check if we should continue (manual start or auto-embeddings enabled)
      const serverCheck = await db
        .select({ autoGenerateEmbeddings: servers.autoGenerateEmbeddings })
        .from(servers)
        .where(eq(servers.id, serverId))
        .limit(1);

      const autoEnabled = serverCheck[0]?.autoGenerateEmbeddings === true;
      if (!manualStart && !autoEnabled) {
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=paused reason=autoDisabled processed=${totalProcessed}`
        );
        break;
      }

      // Fetch next batch of unprocessed items
      const batch = await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.serverId, serverId),
            eq(items.processed, false),
            sql`${items.type} IN ('Movie', 'Series')`
          )
        )
        .limit(ITEMS_PER_BATCH);

      if (batch.length === 0) {
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=completed processed=${totalProcessed} skipped=${totalSkipped} errors=${totalErrors}`
        );
        break;
      }

      await sendHeartbeat();

      // Process the batch
      if (provider === "openai-compatible" && openaiClient) {
        // Process in smaller API batches
        for (let i = 0; i < batch.length; i += API_BATCH_SIZE) {
          // Check stop flag between API calls
          if (await isStopRequested(serverId)) {
            stopped = true;
            break;
          }

          const apiBatch = batch.slice(i, i + API_BATCH_SIZE);
          try {
            const result = await processOpenAIBatch(
              openaiClient,
              apiBatch,
              config,
              validateEmbedding
            );
            totalProcessed += result.processed;
            totalSkipped += result.skipped;
            totalErrors += result.errors;
          } catch (batchError) {
            if (batchError instanceof Error) {
              if (batchError.message.includes("rate_limit")) {
                throw new Error("Rate limit exceeded. Please try again later.");
              }
              if (batchError.message.includes("insufficient_quota")) {
                throw new Error("Quota exceeded. Please check billing.");
              }
              if (
                batchError.message.includes("invalid_api_key") ||
                batchError.message.includes("401")
              ) {
                throw new Error("Invalid API key.");
              }
              // Dimension mismatch should propagate
              if (batchError.message.includes("Dimension mismatch")) {
                throw batchError;
              }
            }
            console.error(`Batch error:`, batchError);
            totalErrors += apiBatch.length;
          }

          await sleep(DEFAULT_RATE_LIMIT_DELAY);
        }
      } else if (provider === "ollama") {
        for (const item of batch) {
          // Check stop flag periodically
          if (totalProcessed % 10 === 0 && (await isStopRequested(serverId))) {
            stopped = true;
            break;
          }

          try {
            const result = await processOllamaItem(item, config, validateEmbedding);
            totalProcessed += result.processed;
            totalSkipped += result.skipped;
            totalErrors += result.errors;
          } catch (itemError) {
            console.error(`Error processing item ${item.id}:`, itemError);
            totalErrors++;
          }

          await sleep(100);
        }
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (stopped) break;
    }

    // Ensure index exists if we processed any items
    if (totalProcessed > 0) {
      await ensureEmbeddingIndex(config.dimensions);
    }

    // Revalidate recommendations cache if we completed (not stopped)
    if (!stopped && totalProcessed > 0) {
      try {
        const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";
        await axios.post(`${nextjsUrl}/api/revalidate-recommendations`, {
          serverId,
        });
        console.info(
          `[embeddings] server=${serverName} serverId=${serverId} action=revalidatedCache`
        );
      } catch {
        // Non-critical
      }
    }

    // Clear stop flag after job completes
    await clearStopFlag(serverId);

    const processingTime = Date.now() - startTime;
    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "completed",
      {
        serverId,
        provider,
        processed: totalProcessed,
        skipped: totalSkipped,
        errors: totalErrors,
        stopped,
      },
      processingTime
    );

    return {
      success: true,
      processed: totalProcessed,
      skipped: totalSkipped,
      errors: totalErrors,
      stopped,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Embedding job failed for server ${serverId}:`, error);

    // Clear stop flag on failure too
    await clearStopFlag(serverId);

    await logJobResult(
      job.id,
      "generate-item-embeddings",
      "failed",
      {
        serverId,
        provider,
        processed: totalProcessed,
        error: error instanceof Error ? error.message : String(error),
      },
      processingTime,
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}
