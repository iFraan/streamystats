"use server";

import {
  computeTasteProfile,
  db,
  type TasteProfileWindow,
} from "@streamystats/database";
import {
  hiddenRecommendations,
  items,
  sessions,
  userEmbeddings,
} from "@streamystats/database/schema";
import {
  and,
  cosineDistance,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  notInArray,
  sql,
} from "drizzle-orm";
import { getStatisticsExclusions } from "./exclusions";

const recommendationItemCardSelect = {
  id: items.id,
  name: items.name,
  type: items.type,
  productionYear: items.productionYear,
  runtimeTicks: items.runtimeTicks,
  genres: items.genres,
  communityRating: items.communityRating,
  primaryImageTag: items.primaryImageTag,
  primaryImageThumbTag: items.primaryImageThumbTag,
  primaryImageLogoTag: items.primaryImageLogoTag,
  backdropImageTags: items.backdropImageTags,
  seriesId: items.seriesId,
  seriesPrimaryImageTag: items.seriesPrimaryImageTag,
  parentBackdropItemId: items.parentBackdropItemId,
  parentBackdropImageTags: items.parentBackdropImageTags,
  parentThumbItemId: items.parentThumbItemId,
  parentThumbImageTag: items.parentThumbImageTag,
} as const;

export interface RecommendationCardItem {
  id: string;
  name: string;
  type: string | null;
  productionYear: number | null;
  runtimeTicks: number | null;
  genres: string[] | null;
  communityRating: number | null;
  primaryImageTag: string | null;
  primaryImageThumbTag: string | null;
  primaryImageLogoTag: string | null;
  backdropImageTags: string[] | null;
  seriesId: string | null;
  seriesPrimaryImageTag: string | null;
  parentBackdropItemId: string | null;
  parentBackdropImageTags: string[] | null;
  parentThumbItemId: string | null;
  parentThumbImageTag: string | null;
}

export interface RecommendationResult {
  item: RecommendationCardItem;
  similarity: number;
  basedOn: RecommendationCardItem[]; // Always [] for profile-based, kept for API compat
}

/** Boost factor for items added in the last 14 days */
const FRESHNESS_BOOST = 1.1;
const FRESHNESS_WINDOW_DAYS = 14;

/**
 * Minimum similarity score to include in results.
 * Filters out noise from items with near-zero or negative cosine similarity.
 */
const MIN_SIMILARITY = 0.05;

/**
 * Maximum number of item IDs to pass in the exclusion list.
 * Postgres handles NOT IN efficiently up to ~5000 values;
 * beyond that, consider a temp table or NOT EXISTS subquery.
 */
const MAX_EXCLUSION_LIST_SIZE = 5000;

async function getStoredProfileVector({
  serverId,
  userId,
}: {
  serverId: number;
  userId: string;
}): Promise<number[] | null> {
  const [profile] = await db
    .select({ embedding: userEmbeddings.embedding })
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, userId),
        eq(userEmbeddings.serverId, serverId),
      ),
    )
    .limit(1);
  return profile?.embedding ?? null;
}

/**
 * Get recommendations from the user's taste profile with a single
 * HNSW-indexed vector search.
 *
 * Without a time window this uses the pre-computed profile. With one, the
 * profile is built from the sessions that started inside the window, so a
 * single watched item is enough to recommend something.
 *
 * @param targetType - "Movie" or "Series" — filters which items to recommend
 */
export async function getProfileRecommendations({
  serverId,
  userId,
  targetType,
  limit,
  offset = 0,
  viewerUserId,
  timeWindow,
}: {
  serverId: number;
  userId: string;
  targetType: "Movie" | "Series" | "all";
  limit: number;
  offset?: number;
  viewerUserId?: string | null;
  timeWindow?: TasteProfileWindow;
}): Promise<RecommendationResult[]> {
  // ── 1. Resolve the user profile ──────────────────────────────────────────
  const profileVector =
    timeWindow?.start || timeWindow?.end
      ? ((
          await computeTasteProfile({
            database: db,
            serverId,
            userId,
            now: Date.now(),
            window: timeWindow,
            minItems: 1,
          })
        )?.embedding ?? null)
      : await getStoredProfileVector({ serverId, userId });

  // No profile yet: the user-embeddings job has not run or there is no history.
  if (!profileVector) {
    return [];
  }
  const { itemLibraryExclusion } = await getStatisticsExclusions(
    serverId,
    viewerUserId === undefined ? userId : (viewerUserId ?? undefined),
  );

  // ── 2. Get hidden + watched item IDs for exclusion ───────────────────────
  const [hiddenRows, watchedMovieRows, watchedSeriesRows] = await Promise.all([
    db
      .select({ itemId: hiddenRecommendations.itemId })
      .from(hiddenRecommendations)
      .where(
        and(
          eq(hiddenRecommendations.serverId, serverId),
          eq(hiddenRecommendations.userId, userId),
        ),
      )
      .catch(() => [] as { itemId: string }[]),

    targetType === "Movie" || targetType === "all"
      ? db
          .selectDistinct({ itemId: sessions.itemId })
          .from(sessions)
          .where(
            and(
              eq(sessions.serverId, serverId),
              eq(sessions.userId, userId),
              isNotNull(sessions.itemId),
            ),
          )
      : Promise.resolve([]),

    targetType === "Series" || targetType === "all"
      ? db
          .selectDistinct({ itemId: sessions.seriesId })
          .from(sessions)
          .where(
            and(
              eq(sessions.serverId, serverId),
              eq(sessions.userId, userId),
              isNotNull(sessions.seriesId),
            ),
          )
      : Promise.resolve([]),
  ]);

  const excludeIds = new Set<string>();
  for (const row of hiddenRows) {
    if (row.itemId) excludeIds.add(row.itemId);
  }
  for (const row of watchedMovieRows) {
    if (row.itemId) excludeIds.add(row.itemId);
  }
  for (const row of watchedSeriesRows) {
    if (row.itemId) excludeIds.add(row.itemId);
  }

  const excludeArray = Array.from(excludeIds);

  // ── 3. Single vector search with freshness boost ─────────────────
  const freshnessThreshold = new Date(
    Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const adjustedSimilarity = sql<number>`
    CASE
      WHEN ${items.createdAt} > ${freshnessThreshold.toISOString()}
      THEN (1 - (${cosineDistance(items.embedding, profileVector)})) * ${FRESHNESS_BOOST}
      ELSE (1 - (${cosineDistance(items.embedding, profileVector)}))
    END
  `;

  const conditions = [
    eq(items.serverId, serverId),
    targetType === "all"
      ? inArray(items.type, ["Movie", "Series"])
      : eq(items.type, targetType),
    isNull(items.deletedAt),
    isNotNull(items.embedding),
    sql`(1 - (${cosineDistance(items.embedding, profileVector)})) > ${MIN_SIMILARITY}`,
    itemLibraryExclusion,
  ];

  // Cap the exclusion list to avoid perf degradation with very large NOT IN clauses
  if (excludeArray.length > 0) {
    if (excludeArray.length > MAX_EXCLUSION_LIST_SIZE) {
      console.warn(
        `[recommendations] userId=${userId} exclusionListSize=${excludeArray.length} action=capped max=${MAX_EXCLUSION_LIST_SIZE}`,
      );
    }
    conditions.push(
      notInArray(items.id, excludeArray.slice(0, MAX_EXCLUSION_LIST_SIZE)),
    );
  }

  const candidates = await db
    .select({
      item: recommendationItemCardSelect,
      similarity: adjustedSimilarity,
    })
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(adjustedSimilarity))
    .limit(limit)
    .offset(offset);

  // ── 4. Map to result shape ────────────────────────────────────────────────
  return candidates.map((row) => ({
    item: row.item,
    similarity: Number(row.similarity),
    basedOn: [], // Profile-based — no individual attribution
  }));
}
