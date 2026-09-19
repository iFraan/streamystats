"use server";

import { db } from "@streamystats/database";
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
  notExists,
  type SQL,
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
  basedOn: RecommendationCardItem[];
}

/** Freshness affects ranking without changing the similarity shown to users. */
const FRESHNESS_MAX_BOOST = 0.03;
const FRESHNESS_DECAY_DAYS = 14;

/** Filters out items with near-zero or negative cosine similarity. */
const MIN_SIMILARITY = 0.05;

const MEANINGFUL_PLAY_RATIO = 0.2;
const MAX_MEANINGFUL_PLAY_SECONDS = 10 * 60;
const MIN_REPEATED_START_SECONDS = 30;

function getMeaningfullyWatchedExclusion({
  serverId,
  userId,
  targetType,
}: {
  serverId: number;
  userId: string;
  targetType: "Movie" | "Series" | "all";
}): SQL {
  const itemReference =
    targetType === "Movie"
      ? sql`watched_sessions.item_id = ${items.id}`
      : targetType === "Series"
        ? sql`watched_sessions.series_id = ${items.id}`
        : sql`(
            (${items.type} = 'Movie' AND watched_sessions.item_id = ${items.id})
            OR
            (${items.type} = 'Series' AND watched_sessions.series_id = ${items.id})
          )`;

  return sql`NOT EXISTS (
    SELECT 1
    FROM ${sessions} AS watched_sessions
    WHERE watched_sessions.server_id = ${serverId}
      AND watched_sessions.user_id = ${userId}
      AND ${itemReference}
    HAVING
      BOOL_OR(watched_sessions.completed)
      OR COALESCE(SUM(watched_sessions.play_duration), 0) >=
        CASE
          WHEN ${items.type} = 'Movie' THEN
            CASE
              WHEN COALESCE(${items.runtimeTicks}, MAX(watched_sessions.runtime_ticks), 0) > 0
                THEN LEAST(
                  ${MAX_MEANINGFUL_PLAY_SECONDS},
                  COALESCE(${items.runtimeTicks}, MAX(watched_sessions.runtime_ticks))
                    / 10000000.0 * ${MEANINGFUL_PLAY_RATIO}
                )
              ELSE ${MAX_MEANINGFUL_PLAY_SECONDS}
            END
          ELSE ${MAX_MEANINGFUL_PLAY_SECONDS}
        END
      OR BOOL_OR(
        COALESCE(watched_sessions.play_duration, 0) >=
          CASE
            WHEN COALESCE(watched_sessions.runtime_ticks, 0) > 0
              THEN LEAST(
                ${MAX_MEANINGFUL_PLAY_SECONDS},
                watched_sessions.runtime_ticks / 10000000.0 * ${MEANINGFUL_PLAY_RATIO}
              )
            ELSE ${MAX_MEANINGFUL_PLAY_SECONDS}
          END
      )
      OR COUNT(*) FILTER (
        WHERE COALESCE(watched_sessions.play_duration, 0) >= ${MIN_REPEATED_START_SECONDS}
      ) >= 2
  )`;
}

/**
 * Get recommendations using the pre-computed user taste profile.
 *
 * @param targetType - "Movie", "Series", or both.
 */
export async function getProfileRecommendations({
  serverId,
  userId,
  targetType,
  limit,
  offset = 0,
  viewerUserId,
}: {
  serverId: number;
  userId: string;
  targetType: "Movie" | "Series" | "all";
  limit: number;
  offset?: number;
  viewerUserId?: string | null;
}): Promise<RecommendationResult[]> {
  const userProfile = await db
    .select({ embedding: userEmbeddings.embedding })
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, userId),
        eq(userEmbeddings.serverId, serverId),
      ),
    )
    .limit(1);

  if (userProfile.length === 0 || !userProfile[0].embedding) {
    return [];
  }

  const profileVector = userProfile[0].embedding;
  const { itemLibraryExclusion } = await getStatisticsExclusions(
    serverId,
    viewerUserId === undefined ? userId : (viewerUserId ?? undefined),
  );

  const similarity = sql<number>`1 - (${cosineDistance(
    items.embedding,
    profileVector,
  )})`;
  const freshness = sql<number>`
    CASE
      WHEN ${items.dateCreated} IS NULL THEN 0
      ELSE EXP(
        -GREATEST(
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ${items.dateCreated})) / 86400.0,
          0
        ) / ${FRESHNESS_DECAY_DAYS}
      )
    END
  `;
  const rankingScore = sql<number>`
    (${similarity}) + ${FRESHNESS_MAX_BOOST} * (${freshness})
  `;

  const hiddenExclusion = notExists(
    db
      .select({ value: sql`1` })
      .from(hiddenRecommendations)
      .where(
        and(
          eq(hiddenRecommendations.serverId, serverId),
          eq(hiddenRecommendations.userId, userId),
          eq(hiddenRecommendations.itemId, items.id),
        ),
      ),
  );

  const conditions: SQL[] = [
    eq(items.serverId, serverId),
    targetType === "all"
      ? inArray(items.type, ["Movie", "Series"])
      : eq(items.type, targetType),
    isNull(items.deletedAt),
    isNotNull(items.embedding),
    sql`${similarity} > ${MIN_SIMILARITY}`,
    hiddenExclusion,
    getMeaningfullyWatchedExclusion({ serverId, userId, targetType }),
  ];

  if (itemLibraryExclusion) {
    conditions.push(itemLibraryExclusion);
  }

  const candidates = await db
    .select({
      item: recommendationItemCardSelect,
      similarity,
    })
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(rankingScore))
    .limit(limit)
    .offset(offset);

  return candidates.map((row) => ({
    item: row.item,
    similarity: Number(row.similarity),
    basedOn: [],
  }));
}
