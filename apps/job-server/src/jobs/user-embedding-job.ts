import {
  db,
  items,
  servers,
  sessions,
  userEmbeddings,
  users,
} from "@streamystats/database";
import {
  normalizeVector,
  toPgVectorLiteral,
} from "@streamystats/database/vector";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { PgBossJob } from "../types/job-status";

export const USER_EMBEDDING_JOB_NAME = "calculate-user-embeddings";

/** Users inactive longer than this many days are skipped. */
const ACTIVE_DAYS_THRESHOLD = 90;

/** Minimum positive taste evidence required to persist a profile. */
const MIN_POSITIVE_EVIDENCE = 0.75;

/** Half-life for recency decay is approximately 200 days. */
const RECENCY_LAMBDA = 0.0035;

/** A single short start is neutral; repeated aggregate bounces are weak negatives. */
const BOUNCE_WEIGHT = -0.15;
const MIN_BOUNCE_SESSIONS = 2;
const BOUNCE_COMPLETION_THRESHOLD = 0.1;

/** Completion is a confidence curve: 10% is neutral and 85% is fully positive. */
const FULL_TASTE_COMPLETION = 0.85;

/** Rewatches strengthen affinity without allowing one title to dominate. */
const REWATCH_BOOST_FACTOR = 0.15;
const MAX_REWATCH_BOOST = 0.35;

/** Number of fully watched episodes needed for full series engagement. */
const SERIES_FULL_ENGAGEMENT_EPISODES = 5;

const userIndexEnsuredForDimension = new Set<number>();

interface CalculateUserEmbeddingsJobData {
  serverId: number;
}

async function ensureUserEmbeddingIndex(dimensions: number): Promise<void> {
  if (userIndexEnsuredForDimension.has(dimensions)) return;

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
      const definition = existing[0].indexdef;
      const dimensionMatch = definition.match(/vector\((\d+)\)/);
      if (
        dimensionMatch &&
        Number.parseInt(dimensionMatch[1], 10) === dimensions
      ) {
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

interface PlaybackSessionEvidence {
  playDuration: number | null;
  runtimeTicks: number | null;
  completed: boolean;
  endTime: Date | null;
  startTime: Date | null;
  createdAt: Date;
}

interface EvidenceAccumulator {
  lifetimeCoverage: number;
  decayedCoverage: number;
  completedEvidence: number;
  latestDecay: number;
  coverageSessionCount: number;
}

interface WatchedItemForProfile {
  itemId: string;
  embedding: number[];
  weight: number;
}

function createEvidenceAccumulator(): EvidenceAccumulator {
  return {
    lifetimeCoverage: 0,
    decayedCoverage: 0,
    completedEvidence: 0,
    latestDecay: 0,
    coverageSessionCount: 0,
  };
}

function calculateRecencyDecay({
  session,
  now,
}: {
  session: PlaybackSessionEvidence;
  now: number;
}): number {
  const watchedAt = session.endTime ?? session.startTime ?? session.createdAt;
  const watchedAtMs = watchedAt.getTime();
  const daysSinceWatched = Number.isFinite(watchedAtMs)
    ? Math.max(0, now - watchedAtMs) / (1000 * 60 * 60 * 24)
    : 0;

  return Math.exp(-RECENCY_LAMBDA * daysSinceWatched);
}

function addSessionEvidence({
  accumulator,
  session,
  now,
}: {
  accumulator: EvidenceAccumulator;
  session: PlaybackSessionEvidence;
  now: number;
}): void {
  const recencyDecay = calculateRecencyDecay({ session, now });
  accumulator.latestDecay = Math.max(accumulator.latestDecay, recencyDecay);

  if (session.completed) {
    accumulator.completedEvidence = Math.max(
      accumulator.completedEvidence,
      recencyDecay,
    );
  }

  const runtimeSeconds = (session.runtimeTicks ?? 0) / 10_000_000;
  const playDuration = session.playDuration ?? 0;
  if (runtimeSeconds <= 0 || playDuration <= 0) return;

  const coverage = playDuration / runtimeSeconds;
  accumulator.lifetimeCoverage += coverage;
  accumulator.decayedCoverage += coverage * recencyDecay;
  accumulator.coverageSessionCount++;
}

function calculateTasteStrength(coverage: number): number {
  return Math.min(
    Math.max(
      (coverage - BOUNCE_COMPLETION_THRESHOLD) /
        (FULL_TASTE_COMPLETION - BOUNCE_COMPLETION_THRESHOLD),
      0,
    ),
    1,
  );
}

function calculateEvidenceWeight(evidence: EvidenceAccumulator): number {
  const positiveStrength = Math.max(
    calculateTasteStrength(evidence.decayedCoverage),
    evidence.completedEvidence,
  );

  if (positiveStrength > 0) {
    const rewatchEvidence = Math.max(0, evidence.decayedCoverage - 1);
    const rewatchBoost =
      1 +
      Math.min(
        MAX_REWATCH_BOOST,
        REWATCH_BOOST_FACTOR * Math.log1p(rewatchEvidence),
      );
    return positiveStrength * rewatchBoost;
  }

  if (
    evidence.coverageSessionCount >= MIN_BOUNCE_SESSIONS &&
    evidence.lifetimeCoverage < BOUNCE_COMPLETION_THRESHOLD
  ) {
    return BOUNCE_WEIGHT * evidence.latestDecay;
  }

  return 0;
}

async function computeUserProfile({
  serverId,
  userId,
  now,
  dimensions,
}: {
  serverId: number;
  userId: string;
  now: number;
  dimensions: number;
}): Promise<{ embedding: number[]; itemCount: number } | null> {
  const episodeItems = alias(items, "episode_items");
  const movieRows = await db
    .select({
      itemId: sessions.itemId,
      embedding: items.embedding,
      playDuration: sessions.playDuration,
      sessionRuntimeTicks: sessions.runtimeTicks,
      itemRuntimeTicks: items.runtimeTicks,
      completed: sessions.completed,
      endTime: sessions.endTime,
      startTime: sessions.startTime,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(
      items,
      and(eq(items.id, sessions.itemId), eq(items.type, "Movie")),
    )
    .where(
      and(
        eq(sessions.serverId, serverId),
        eq(sessions.userId, userId),
        isNotNull(items.embedding),
      ),
    );

  const seriesRows = await db
    .select({
      seriesId: sessions.seriesId,
      episodeId: sessions.itemId,
      embedding: items.embedding,
      playDuration: sessions.playDuration,
      sessionRuntimeTicks: sessions.runtimeTicks,
      itemRuntimeTicks: episodeItems.runtimeTicks,
      completed: sessions.completed,
      endTime: sessions.endTime,
      startTime: sessions.startTime,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(
      items,
      and(eq(items.id, sessions.seriesId), eq(items.type, "Series")),
    )
    .leftJoin(episodeItems, eq(episodeItems.id, sessions.itemId))
    .where(
      and(
        eq(sessions.serverId, serverId),
        eq(sessions.userId, userId),
        isNotNull(sessions.seriesId),
        isNotNull(sessions.itemId),
        isNotNull(items.embedding),
      ),
    );

  const watched: WatchedItemForProfile[] = [];
  const movieEvidence = new Map<
    string,
    { embedding: number[]; evidence: EvidenceAccumulator }
  >();

  for (const row of movieRows) {
    if (!row.embedding || !row.itemId) continue;
    const existing = movieEvidence.get(row.itemId) ?? {
      embedding: row.embedding,
      evidence: createEvidenceAccumulator(),
    };
    addSessionEvidence({
      accumulator: existing.evidence,
      session: {
        playDuration: row.playDuration,
        runtimeTicks: row.itemRuntimeTicks ?? row.sessionRuntimeTicks,
        completed: row.completed,
        endTime: row.endTime,
        startTime: row.startTime,
        createdAt: row.createdAt,
      },
      now,
    });
    movieEvidence.set(row.itemId, existing);
  }

  for (const [itemId, item] of movieEvidence) {
    watched.push({
      itemId,
      embedding: item.embedding,
      weight: calculateEvidenceWeight(item.evidence),
    });
  }

  const seriesEvidence = new Map<
    string,
    {
      embedding: number[];
      episodes: Map<string, EvidenceAccumulator>;
    }
  >();

  for (const row of seriesRows) {
    if (!row.embedding || !row.seriesId || !row.episodeId) continue;
    const series = seriesEvidence.get(row.seriesId) ?? {
      embedding: row.embedding,
      episodes: new Map<string, EvidenceAccumulator>(),
    };
    const episode =
      series.episodes.get(row.episodeId) ?? createEvidenceAccumulator();
    addSessionEvidence({
      accumulator: episode,
      session: {
        playDuration: row.playDuration,
        runtimeTicks: row.itemRuntimeTicks ?? row.sessionRuntimeTicks,
        completed: row.completed,
        endTime: row.endTime,
        startTime: row.startTime,
        createdAt: row.createdAt,
      },
      now,
    });
    series.episodes.set(row.episodeId, episode);
    seriesEvidence.set(row.seriesId, series);
  }

  for (const [seriesId, series] of seriesEvidence) {
    let positiveEpisodeEvidence = 0;
    let strongestNegativeEvidence = 0;

    for (const episode of series.episodes.values()) {
      const episodeWeight = calculateEvidenceWeight(episode);
      if (episodeWeight > 0) {
        positiveEpisodeEvidence += episodeWeight;
      } else {
        strongestNegativeEvidence = Math.min(
          strongestNegativeEvidence,
          episodeWeight,
        );
      }
    }

    const weight =
      positiveEpisodeEvidence > 0
        ? Math.min(positiveEpisodeEvidence / SERIES_FULL_ENGAGEMENT_EPISODES, 1)
        : strongestNegativeEvidence;
    watched.push({
      itemId: seriesId,
      embedding: series.embedding,
      weight,
    });
  }

  const profile = new Array<number>(dimensions).fill(0);
  let totalAbsWeight = 0;
  let positiveEvidence = 0;
  let positiveContributorCount = 0;

  for (const item of watched) {
    if (item.weight === 0) continue;
    if (item.embedding.length !== dimensions) {
      console.warn(
        `[user-embeddings] userId=${userId} itemId=${item.itemId} action=skipDimensionMismatch expected=${dimensions} got=${item.embedding.length}`,
      );
      continue;
    }

    if (item.weight > 0) {
      positiveEvidence += item.weight;
      positiveContributorCount++;
    }

    for (let dimension = 0; dimension < dimensions; dimension++) {
      profile[dimension] += item.weight * item.embedding[dimension];
    }
    totalAbsWeight += Math.abs(item.weight);
  }

  if (
    totalAbsWeight === 0 ||
    positiveEvidence < MIN_POSITIVE_EVIDENCE ||
    positiveContributorCount === 0
  ) {
    return null;
  }

  const magnitudeSquared = profile.reduce(
    (total, value) => total + value * value,
    0,
  );
  if (!Number.isFinite(magnitudeSquared) || magnitudeSquared < 1e-20) {
    return null;
  }

  return {
    embedding: normalizeVector(profile),
    itemCount: positiveContributorCount,
  };
}

export async function calculateUserEmbeddingsJob(
  job: PgBossJob<CalculateUserEmbeddingsJobData>,
) {
  const { serverId } = job.data;
  const startTime = Date.now();

  console.log(`[user-embeddings] action=start serverId=${serverId}`);

  try {
    const server = await db
      .select({
        embeddingDimensions: servers.embeddingDimensions,
      })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    const dimensions = server[0]?.embeddingDimensions ?? 1536;
    await ensureUserEmbeddingIndex(dimensions);

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
      const result = await computeUserProfile({
        serverId,
        userId: user.id,
        now,
        dimensions,
      });

      if (!result) {
        await db
          .delete(userEmbeddings)
          .where(
            and(
              eq(userEmbeddings.userId, user.id),
              eq(userEmbeddings.serverId, serverId),
            ),
          );
        skipped++;
        continue;
      }

      const upsertNow = new Date();
      await db
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

      processed++;
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
