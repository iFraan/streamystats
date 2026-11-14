import { and, eq, gte, isNotNull, lte, type SQL, sql } from "drizzle-orm";
import type { db } from "./connection";
import { items, sessions } from "./schema";
import { normalizeVector } from "./vector";

/** Users with fewer than this many watched items with embeddings get no profile. */
export const MIN_ITEMS_FOR_TASTE_PROFILE = 3;

/** Half-life for recency decay ≈ 200 days (more forgiving). */
const RECENCY_LAMBDA = 0.0035;

/** Weight applied to items the user "bounced" from. */
const BOUNCE_WEIGHT = -0.3;

/** Number of episodes to consider a series "fully engaged" for profile weighting. */
const SERIES_FULL_ENGAGEMENT_EPISODES = 5;

/** Minimum average completion per episode to avoid bounce penalty for series. */
const SERIES_BOUNCE_THRESHOLD = 0.15;

/** Minimum average completion to avoid bounce penalty for movies. */
const MOVIES_BOUNCE_THRESHOLD = 0.1;

const TICKS_PER_SECOND = 10_000_000;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TasteProfileWatchedItem {
  itemId: string;
  embedding: number[];
  type: "Movie" | "Series";
  /** Seconds played across every session of the movie or the series' episodes. */
  totalPlayDuration: number;
  /** Expected runtime in ticks; for a series, the average episode runtime times the episodes watched. */
  expectedRuntime: number;
  lastWatchedMs: number;
  /** 1 for movies, distinct episodes watched for series. */
  episodeCount: number;
}

export interface TasteProfile {
  embedding: number[];
  itemCount: number;
}

export interface TasteProfileWindow {
  start?: Date;
  end?: Date;
}

function itemWeight({
  item,
  now,
}: {
  item: TasteProfileWatchedItem;
  now: number;
}): number {
  const daysSinceWatched = (now - item.lastWatchedMs) / MS_PER_DAY;
  const recencyDecay = Math.exp(-RECENCY_LAMBDA * daysSinceWatched);
  const expectedRuntimeSeconds = item.expectedRuntime / TICKS_PER_SECOND;
  const completion =
    expectedRuntimeSeconds > 0 && item.episodeCount > 0
      ? item.totalPlayDuration / expectedRuntimeSeconds
      : 0;

  if (item.type === "Movie") {
    return completion < MOVIES_BOUNCE_THRESHOLD
      ? BOUNCE_WEIGHT
      : completion * recencyDecay;
  }

  if (completion < SERIES_BOUNCE_THRESHOLD) return BOUNCE_WEIGHT;
  const engagement = Math.min(
    item.episodeCount / SERIES_FULL_ENGAGEMENT_EPISODES,
    1.0,
  );
  const rewatchBoost = Math.max(completion, 1.0);
  return engagement * rewatchBoost * recencyDecay;
}

/**
 * Weighted, unit-length average of the watched items' embeddings. Items whose
 * embedding dimension differs from the first one are ignored.
 */
export function buildTasteProfile({
  watched,
  now,
  minItems = MIN_ITEMS_FOR_TASTE_PROFILE,
}: {
  watched: TasteProfileWatchedItem[];
  now: number;
  minItems?: number;
}): TasteProfile | null {
  if (watched.length === 0 || watched.length < minItems) return null;

  const dims = watched[0].embedding.length;
  const profile = new Array<number>(dims).fill(0);
  let totalAbsWeight = 0;

  for (const item of watched) {
    if (item.embedding.length !== dims) continue;
    const weight = itemWeight({ item, now });
    for (let d = 0; d < dims; d++) {
      profile[d] += weight * item.embedding[d];
    }
    totalAbsWeight += Math.abs(weight);
  }

  if (totalAbsWeight === 0) return null;

  for (let d = 0; d < dims; d++) {
    profile[d] /= totalAbsWeight;
  }

  return { embedding: normalizeVector(profile), itemCount: watched.length };
}

/**
 * Build a user's taste profile from their watch history on one server. With a
 * window, only sessions that started inside it count.
 */
export async function computeTasteProfile({
  database,
  serverId,
  userId,
  now,
  window,
  minItems,
}: {
  database: Pick<typeof db, "select">;
  serverId: number;
  userId: string;
  now: number;
  window?: TasteProfileWindow;
  minItems?: number;
}): Promise<TasteProfile | null> {
  const sessionConditions: SQL[] = [
    eq(sessions.serverId, serverId),
    eq(sessions.userId, userId),
    isNotNull(sessions.playDuration),
    isNotNull(items.embedding),
  ];
  if (window?.start)
    sessionConditions.push(gte(sessions.startTime, window.start));
  if (window?.end) sessionConditions.push(lte(sessions.startTime, window.end));

  // Sequential on purpose: the job passes a transaction, which runs one query at a time.
  const movieRows = await database
    .select({
      itemId: sessions.itemId,
      embedding: items.embedding,
      totalPlayDuration: sql<number>`SUM(${sessions.playDuration})`.as(
        "totalPlayDuration",
      ),
      expectedRuntime: items.runtimeTicks,
      lastWatched: sql<string>`MAX(${sessions.endTime})`.as("lastWatched"),
    })
    .from(sessions)
    .innerJoin(
      items,
      and(
        eq(items.id, sessions.itemId),
        eq(items.serverId, sessions.serverId),
        eq(items.type, "Movie"),
      ),
    )
    .where(and(...sessionConditions))
    .groupBy(sessions.itemId, items.serverId, items.id);
  const seriesRows = await database
    .select({
      seriesId: sessions.seriesId,
      embedding: items.embedding,
      episodeCount: sql<number>`COUNT(DISTINCT ${sessions.itemId})`.as(
        "episodeCount",
      ),
      totalPlayDuration: sql<number>`SUM(${sessions.playDuration})`.as(
        "totalPlayDuration",
      ),
      avgEpisodeRuntimeTicks: sql<number>`AVG(${sessions.runtimeTicks})`.as(
        "avgEpisodeRuntimeTicks",
      ),
      lastWatched: sql<string>`MAX(${sessions.endTime})`.as("lastWatched"),
    })
    .from(sessions)
    .innerJoin(
      items,
      and(
        eq(items.id, sessions.seriesId),
        eq(items.serverId, sessions.serverId),
        eq(items.type, "Series"),
      ),
    )
    .where(and(...sessionConditions, isNotNull(sessions.seriesId)))
    .groupBy(sessions.seriesId, items.serverId, items.id);

  const lastWatchedMs = (value: string | null) =>
    value ? new Date(value).getTime() : now;
  const watched: TasteProfileWatchedItem[] = [];

  for (const row of movieRows) {
    if (!row.embedding || !row.itemId) continue;
    watched.push({
      itemId: row.itemId,
      embedding: row.embedding,
      type: "Movie",
      totalPlayDuration: Number(row.totalPlayDuration ?? 0),
      expectedRuntime: row.expectedRuntime ?? 0,
      lastWatchedMs: lastWatchedMs(row.lastWatched),
      episodeCount: 1,
    });
  }

  for (const row of seriesRows) {
    if (!row.embedding || !row.seriesId) continue;
    const episodeCount = Number(row.episodeCount ?? 1);
    watched.push({
      itemId: row.seriesId,
      embedding: row.embedding,
      type: "Series",
      totalPlayDuration: Number(row.totalPlayDuration ?? 0),
      expectedRuntime: Number(row.avgEpisodeRuntimeTicks ?? 0) * episodeCount,
      lastWatchedMs: lastWatchedMs(row.lastWatched),
      episodeCount,
    });
  }

  return buildTasteProfile({ watched, now, minItems });
}
