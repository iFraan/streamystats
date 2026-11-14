import {
  computeTasteProfile,
  db,
  users,
  servers,
  userEmbeddings,
} from "@streamystats/database";
import { and, eq, sql, gte } from "drizzle-orm";
import type { PgBossJob } from "../types/job-status";
import { toPgVectorLiteral } from "@streamystats/database/vector";

export const USER_EMBEDDING_JOB_NAME = "calculate-user-embeddings";

/** Users inactive longer than this many days are skipped. */
const ACTIVE_DAYS_THRESHOLD = 90;

// Track if user embedding HNSW index has been ensured this session (per dimension)
const userIndexEnsuredForDimension = new Set<number>();

interface CalculateUserEmbeddingsJobData {
  serverId: number;
}

/**
 * Ensure an HNSW index exists on user_embeddings.embedding for the given
 * dimension, mirroring `ensureEmbeddingIndex` in embedding-jobs.ts.
 */
async function ensureUserEmbeddingIndex(dimensions: number): Promise<void> {
  if (userIndexEnsuredForDimension.has(dimensions)) return;

  // pgvector HNSW upper bound
  if (dimensions > 2000) {
    console.info(
      `[user-embeddings-index] dimensions=${dimensions} action=skip reason=exceedsMaxDimensions`,
    );
    await db.execute(sql`DROP INDEX IF EXISTS user_embeddings_embedding_idx`);
    userIndexEnsuredForDimension.add(dimensions);
    return;
  }

  try {
    const existing = await db.execute<{
      indexname: string;
      indexdef: string;
    }>(sql`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE tablename = 'user_embeddings' AND indexname = 'user_embeddings_embedding_idx'
    `);

    if (existing.length > 0) {
      const def = existing[0].indexdef;
      const m = def.match(/vector\((\d+)\)/);
      if (m && Number.parseInt(m[1], 10) === dimensions) {
        userIndexEnsuredForDimension.add(dimensions);
        return;
      }
      console.info(
        `[user-embeddings-index] dimensions=${dimensions} action=dropExisting reason=dimensionMismatch`,
      );
      await db.execute(sql`DROP INDEX IF EXISTS user_embeddings_embedding_idx`);
    }

    console.info(
      `[user-embeddings-index] dimensions=${dimensions} action=create method=hnsw`,
    );
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS user_embeddings_embedding_idx
      ON user_embeddings
      USING hnsw ((embedding::vector(${sql.raw(String(dimensions))})) vector_cosine_ops)
    `);
    userIndexEnsuredForDimension.add(dimensions);
  } catch (error) {
    console.warn("[user-embeddings-index] Could not create index:", error);
  }
}

export async function calculateUserEmbeddingsJob(
  job: PgBossJob<CalculateUserEmbeddingsJobData>,
) {
  const { serverId } = job.data;
  const startTime = Date.now();

  console.log(`[user-embeddings] action=start serverId=${serverId}`);

  try {
    // ── Get server embedding dimensions ──────────────────────────────────
    const server = await db
      .select({
        embeddingDimensions: servers.embeddingDimensions,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    const dimensions = server[0]?.embeddingDimensions ?? 1536;

    // Ensure HNSW index for user embeddings
    await ensureUserEmbeddingIndex(dimensions);

    // ── Get active users ─────────────────────────────────────────────────
    const cutoff = new Date(
      Date.now() - ACTIVE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000,
    );

    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.serverId, serverId), gte(users.lastActivityDate, cutoff)),
      );

    if (activeUsers.length === 0) {
      console.log(
        `[user-embeddings] action=complete serverId=${serverId} users=0`,
      );
      return { usersProcessed: 0, usersSkipped: 0 };
    }

    console.log(
      `[user-embeddings] serverId=${serverId} activeUsers=${activeUsers.length}`,
    );

    let processed = 0;
    let skipped = 0;
    const now = Date.now();

    for (const user of activeUsers) {
      const calculated = await db.transaction(async (transaction) => {
        await transaction.execute(
          sql`SELECT pg_advisory_xact_lock_shared(582, ${serverId})`,
        );
        const [account] = await transaction
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, user.id), eq(users.serverId, serverId)))
          .limit(1);
        if (!account) return false;
        const result = await computeTasteProfile({
          database: transaction,
          serverId,
          userId: user.id,
          now,
        });
        if (!result) return false;
        const upsertNow = new Date();
        await transaction
          .insert(userEmbeddings)
          .values({
            userId: user.id,
            serverId,
            embedding: sql`${toPgVectorLiteral(result.embedding)}::vector`,
            itemCount: result.itemCount,
            lastCalculatedAt: upsertNow,
          })
          .onConflictDoUpdate({
            target: [userEmbeddings.userId, userEmbeddings.serverId],
            set: {
              embedding: sql`${toPgVectorLiteral(result.embedding)}::vector`,
              itemCount: result.itemCount,
              lastCalculatedAt: upsertNow,
              updatedAt: upsertNow,
            },
          });

        return true;
      });
      if (calculated) processed++;
      else skipped++;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[user-embeddings] action=complete serverId=${serverId} processed=${processed} skipped=${skipped} durationMs=${duration}`,
    );

    return { usersProcessed: processed, usersSkipped: skipped };
  } catch (error) {
    console.error(`[user-embeddings] action=error serverId=${serverId}`, error);
    throw error;
  }
}
