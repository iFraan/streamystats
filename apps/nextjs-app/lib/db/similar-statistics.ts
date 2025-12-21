"use server";

import { db } from "@streamystats/database";
import {
  type Item,
  hiddenRecommendations,
  items,
  sessions,
} from "@streamystats/database/schema";
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";
import { cosineDistance } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { getExclusionSettings } from "./exclusions";
import { getMe } from "./users";

const debugLog = (..._args: unknown[]) => {};

export type RecommendationTimeWindow = {
  start?: Date;
  end?: Date;
};

export interface RecommendationItem {
  item: RecommendationCardItem;
  similarity: number;
  basedOn: RecommendationCardItem[];
}

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

type RecommendationCardItemWithEmbedding = RecommendationCardItem & {
  embedding: Item["embedding"];
};

const itemCardSelect = {
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

const itemCardWithEmbeddingSelect = {
  ...itemCardSelect,
  embedding: items.embedding,
} as const;

const itemCardWithEmbeddingColumns = {
  id: true,
  name: true,
  type: true,
  productionYear: true,
  runtimeTicks: true,
  genres: true,
  communityRating: true,
  primaryImageTag: true,
  primaryImageThumbTag: true,
  primaryImageLogoTag: true,
  backdropImageTags: true,
  seriesId: true,
  seriesPrimaryImageTag: true,
  parentBackdropItemId: true,
  parentBackdropImageTags: true,
  parentThumbItemId: true,
  parentThumbImageTag: true,
  embedding: true,
} as const;

const stripEmbedding = (
  item: RecommendationCardItemWithEmbedding,
): RecommendationCardItem => {
  const { embedding: _embedding, ...card } = item;
  return card;
};

const RECOMMENDATION_POOL_SIZE = 500;

async function getSimilarStatisticsCached(
  serverIdNum: number,
  userId: string,
  poolSize: number,
  timeWindow?: RecommendationTimeWindow,
): Promise<RecommendationItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(
    `recommendations-${serverIdNum}`,
    `recommendations-${serverIdNum}-${userId}`,
  );

  try {
    debugLog(
      `\n🚀 Starting recommendation process for server ${serverIdNum}, user ${userId}, pool size ${poolSize}`,
    );

    let recommendations: RecommendationItem[] = [];

    debugLog("\n📊 Getting user-specific recommendations...");
    recommendations = await getUserSpecificRecommendations(
      serverIdNum,
      userId,
      poolSize,
      timeWindow,
    );
    debugLog(`✅ Got ${recommendations.length} user-specific recommendations`);

    if (recommendations.length < poolSize) {
      const remainingLimit = poolSize - recommendations.length;
      debugLog(
        `\n🔥 Need ${remainingLimit} more recommendations, getting popular items...`,
      );
      const popularRecommendations = await getPopularRecommendations(
        serverIdNum,
        remainingLimit,
        userId,
      );
      debugLog(
        `✅ Got ${popularRecommendations.length} popular recommendations`,
      );
      recommendations = [...recommendations, ...popularRecommendations];
    }

    debugLog(
      `\n🎉 Final result: ${recommendations.length} total recommendations`,
    );
    return recommendations;
  } catch (error) {
    debugLog("❌ Error getting similar statistics:", error);
    return [];
  }
}

export async function getSimilarStatistics(
  serverId: string | number,
  userId?: string,
  limit = 20,
  offset = 0,
  timeWindow?: RecommendationTimeWindow,
): Promise<RecommendationItem[]> {
  const serverIdNum = Number(serverId);

  let targetUserId = userId;
  if (!targetUserId) {
    const currentUser = await getMe();
    if (currentUser && currentUser.serverId === serverIdNum) {
      targetUserId = currentUser.id;
      debugLog(`🔍 Using current user: ${targetUserId}`);
    } else {
      debugLog("❌ No valid user found for recommendations");
      return [];
    }
  }

  const allRecommendations = await getSimilarStatisticsCached(
    serverIdNum,
    targetUserId,
    RECOMMENDATION_POOL_SIZE,
    timeWindow,
  );

  return allRecommendations.slice(offset, offset + limit);
}

export const revalidateRecommendations = async (
  serverId: number,
  userId?: string,
) => {
  revalidateTag(`recommendations-${serverId}`, "hours");
  if (userId) {
    revalidateTag(`recommendations-${serverId}-${userId}`, "hours");
  }
};

async function getUserSpecificRecommendations(
  serverId: number,
  userId: string,
  limit: number,
  timeWindow?: RecommendationTimeWindow,
): Promise<RecommendationItem[]> {
  debugLog(
    `\n🎯 Starting user-specific recommendations for user ${userId}, server ${serverId}, limit ${limit}`,
  );

  const sessionTimeConditions = [
    timeWindow?.start ? gte(sessions.startTime, timeWindow.start) : null,
    timeWindow?.end ? lte(sessions.startTime, timeWindow.end) : null,
  ].filter((c): c is Exclude<typeof c, null> => c !== null);

  // Get user's watch history with total play duration and recent activity
  const userWatchHistory = await db
    .select({
      itemId: sessions.itemId,
      item: itemCardWithEmbeddingSelect,
      totalPlayDuration: sql<number>`SUM(${sessions.playDuration})`.as(
        "totalPlayDuration",
      ),
      lastWatched: sql<Date>`MAX(${sessions.endTime})`.as("lastWatched"),
    })
    .from(sessions)
    .innerJoin(items, eq(sessions.itemId, items.id))
    .where(
      and(
        eq(sessions.serverId, serverId),
        eq(sessions.userId, userId),
        isNotNull(items.embedding),
        isNotNull(sessions.playDuration),
        ...sessionTimeConditions,
      ),
    )
    .groupBy(sessions.itemId, items.id)
    .orderBy(sql`MAX(${sessions.endTime}) DESC`);

  debugLog(`📊 Found ${userWatchHistory.length} items in watch history`);
  userWatchHistory.forEach((item, index) => {
    debugLog(
      `  ${index + 1}. "${item.item.name}" - ${Math.round(
        item.totalPlayDuration / 60,
      )}min total, last watched: ${item.lastWatched}`,
    );
  });

  if (userWatchHistory.length === 0) {
    debugLog("❌ No watch history found, returning empty recommendations");
    return [];
  }

  // Extract watched items and their IDs
  const watchedItems = userWatchHistory.map((w) => w.item);
  const watchedItemIds = watchedItems.map((item) => item.id);

  // Get hidden recommendations for this user
  let hiddenItems: { itemId: string }[] = [];
  try {
    hiddenItems = await db
      .select({ itemId: hiddenRecommendations.itemId })
      .from(hiddenRecommendations)
      .where(
        and(
          eq(hiddenRecommendations.serverId, serverId),
          eq(hiddenRecommendations.userId, userId),
        ),
      );
  } catch (error) {
    debugLog("Error fetching hidden recommendations:", error);
    hiddenItems = [];
  }

  const hiddenItemIds = hiddenItems.map((h) => h.itemId).filter(Boolean);
  debugLog(`🙈 Found ${hiddenItemIds.length} hidden items`);

  // Use multiple movies to create recommendations
  const recommendations: RecommendationItem[] = [];
  const usedRecommendationIds = new Set<string>();

  // Hybrid approach: prioritize recent watches but include some highly watched items
  // Take recent watches (first 5) and mix with some top watched items
  const recentWatches = watchedItems.slice(0, 5); // Most recent 5
  debugLog(`⏰ Recent watches (${recentWatches.length}):`);
  recentWatches.forEach((item, index) => {
    debugLog(`  ${index + 1}. "${item.name}"`);
  });

  // Get top watched items ordered by total play duration
  const topWatchedHistory = await db
    .select({
      itemId: sessions.itemId,
      item: itemCardWithEmbeddingSelect,
      totalPlayDuration: sql<number>`SUM(${sessions.playDuration})`.as(
        "totalPlayDuration",
      ),
    })
    .from(sessions)
    .innerJoin(items, eq(sessions.itemId, items.id))
    .where(
      and(
        eq(sessions.serverId, serverId),
        eq(sessions.userId, userId),
        isNotNull(items.embedding),
        isNotNull(sessions.playDuration),
        ...sessionTimeConditions,
      ),
    )
    .groupBy(sessions.itemId, items.id)
    .orderBy(desc(sql<number>`SUM(${sessions.playDuration})`))
    .limit(10);

  const topWatchedItems = topWatchedHistory.map((w) => w.item);
  debugLog(`🔥 Top watched by duration (${topWatchedItems.length}):`);
  topWatchedHistory.forEach((item, index) => {
    debugLog(
      `  ${index + 1}. "${item.item.name}" - ${Math.round(
        item.totalPlayDuration / 60,
      )}min total`,
    );
  });

  // Combine recent and top watched, remove duplicates, limit to 15
  const recentIds = new Set(recentWatches.map((item) => item.id));
  const additionalTopWatched = topWatchedItems.filter(
    (item) => !recentIds.has(item.id),
  );

  const baseMovies = [...recentWatches, ...additionalTopWatched].slice(0, 15);
  debugLog(`🎬 Final base movies for similarity (${baseMovies.length}):`);
  baseMovies.forEach((item, index) => {
    const isRecent = recentIds.has(item.id);
    debugLog(
      `  ${index + 1}. "${item.name}" (${isRecent ? "recent" : "top watched"})`,
    );
  });

  if (baseMovies.length === 0) {
    debugLog("❌ No base movies found, returning empty recommendations");
    return [];
  }

  // Get candidate items similar to any of the base movies
  const candidateItems = new Map<
    string,
    {
      item: RecommendationCardItem;
      similarities: number[];
      basedOn: RecommendationCardItemWithEmbedding[];
    }
  >();

  for (const watchedItem of baseMovies) {
    if (!watchedItem.embedding) {
      debugLog(`⚠️ Skipping "${watchedItem.name}" - no embedding`);
      continue;
    }

    debugLog(`\n🔍 Finding items similar to "${watchedItem.name}"`);

    // Calculate cosine similarity with other items
    const similarity = sql<number>`1 - (${cosineDistance(
      items.embedding,
      watchedItem.embedding,
    )})`;

    // Get a large pool of similar items with low threshold, sorted by similarity
    const allSimilarItems = await db
      .select({
        item: itemCardSelect,
        similarity: similarity,
      })
      .from(items)
      .where(
        and(
          eq(items.serverId, serverId),
          isNull(items.deletedAt),
          eq(items.type, "Movie"),
          isNotNull(items.embedding),
          notInArray(items.id, watchedItemIds), // Exclude already watched items
          hiddenItemIds.length > 0
            ? notInArray(items.id, hiddenItemIds)
            : sql`true`, // Exclude hidden items
        ),
      )
      .orderBy(desc(similarity))
      .limit(200); // Get a large pool for each base movie

    debugLog("  📊 Similarity score distribution (top 10):");
    allSimilarItems.slice(0, 10).forEach((result, index) => {
      debugLog(
        `    ${index + 1}. "${result.item.name}" - similarity: ${Number(
          result.similarity,
        ).toFixed(3)}`,
      );
    });

    // Filter with low threshold to ensure we have enough candidates
    // Results are already sorted by similarity, so best matches come first
    const similarItems = allSimilarItems.filter(
      (result) => Number(result.similarity) > 0.1,
    );

    debugLog(
      `  Found ${similarItems.length} similar items (similarity > 0.1):`,
    );
    similarItems.slice(0, 5).forEach((result, index) => {
      debugLog(
        `    ${index + 1}. "${result.item.name}" - similarity: ${Number(
          result.similarity,
        ).toFixed(3)}`,
      );
    });
    if (similarItems.length > 5) {
      debugLog(`    ... and ${similarItems.length - 5} more`);
    }

    // Add similarities to candidate items
    for (const result of similarItems) {
      const itemId = result.item.id;
      const simScore = Number(result.similarity);

      if (!candidateItems.has(itemId)) {
        candidateItems.set(itemId, {
          item: result.item,
          similarities: [],
          basedOn: [],
        });
      }

      const candidate = candidateItems.get(itemId);
      if (!candidate) continue;
      candidate.similarities.push(simScore);
      candidate.basedOn.push(watchedItem);
    }
  }

  debugLog(`\n📋 Total unique candidate items: ${candidateItems.size}`);

  // Ensure each base movie gets at least one recommendation (if possible)
  const recommendationsPerBaseMovie = new Map<string, RecommendationItem[]>();

  // Group candidates by which base movie they're similar to
  for (const candidate of candidateItems.values()) {
    for (let i = 0; i < candidate.basedOn.length; i++) {
      const baseMovie = candidate.basedOn[i];
      const similarity = candidate.similarities[i];

      if (!recommendationsPerBaseMovie.has(baseMovie.id)) {
        recommendationsPerBaseMovie.set(baseMovie.id, []);
      }

      const bucket = recommendationsPerBaseMovie.get(baseMovie.id);
      if (!bucket) continue;
      bucket.push({
        item: candidate.item,
        similarity,
        basedOn: [stripEmbedding(baseMovie)],
      });
    }
  }

  // Get the best recommendation for each base movie, deduplicating by item ID
  const guaranteedRecommendations: RecommendationItem[] = [];
  const guaranteedItemIds = new Set<string>();
  debugLog("\n🎯 Guaranteed recommendations (one per base movie):");
  for (const [baseMovieId, recs] of recommendationsPerBaseMovie) {
    if (recs.length > 0) {
      // Sort by similarity and find the best one that hasn't been added yet
      const sortedRecs = recs.sort((a, b) => b.similarity - a.similarity);
      const bestRec = sortedRecs.find((r) => !guaranteedItemIds.has(r.item.id));
      if (bestRec) {
        const baseMovie = baseMovies.find((m) => m.id === baseMovieId);
        debugLog(
          `  "${bestRec.item.name}" (similarity: ${bestRec.similarity.toFixed(
            3,
          )}) <- based on "${baseMovie?.name}"`,
        );
        guaranteedRecommendations.push(bestRec);
        guaranteedItemIds.add(bestRec.item.id);
      }
    }
  }

  // Sort guaranteed recommendations by similarity
  guaranteedRecommendations.sort((a, b) => b.similarity - a.similarity);

  // Get multi-movie matches for remaining slots
  const multiMovieMatches = Array.from(candidateItems.values())
    .filter((candidate) => candidate.similarities.length >= 2)
    .map((candidate) => ({
      item: candidate.item,
      similarity:
        candidate.similarities.reduce((sum, sim) => sum + sim, 0) /
        candidate.similarities.length,
      basedOn: candidate.basedOn.slice(0, 3).map(stripEmbedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  debugLog(
    `\n🎭 Multi-movie matches (${multiMovieMatches.length} items similar to 2+ base movies):`,
  );
  multiMovieMatches.slice(0, 5).forEach((match, index) => {
    const baseMovieNames = match.basedOn.map((m) => `"${m.name}"`).join(", ");
    debugLog(
      `  ${index + 1}. "${
        match.item.name
      }" (avg similarity: ${match.similarity.toFixed(
        3,
      )}) <- based on ${baseMovieNames}`,
    );
  });

  // Combine guaranteed + multi-movie + fill remaining with best single matches
  const usedItemIds = new Set(guaranteedRecommendations.map((r) => r.item.id));
  const additionalMultiMovieMatches = multiMovieMatches.filter(
    (m) => !usedItemIds.has(m.item.id),
  );

  const qualifiedCandidates = [
    ...guaranteedRecommendations,
    ...additionalMultiMovieMatches,
  ];

  // Take the top recommendations
  const finalRecommendations = qualifiedCandidates.slice(0, limit);
  recommendations.push(...finalRecommendations);

  debugLog(`\n✅ Final ${finalRecommendations.length} recommendations:`);
  finalRecommendations.forEach((rec, index) => {
    const baseMovieNames = rec.basedOn.map((m) => `"${m.name}"`).join(", ");
    const type = rec.basedOn.length >= 2 ? "multi-movie" : "single-movie";
    debugLog(
      `  ${index + 1}. "${rec.item.name}" (similarity: ${rec.similarity.toFixed(
        3,
      )}, ${type}) <- ${baseMovieNames}`,
    );
  });

  return recommendations.slice(0, limit);
}

async function getPopularRecommendations(
  serverId: number,
  limit: number,
  excludeUserId?: string,
): Promise<RecommendationItem[]> {
  debugLog(
    `\n🔥 Getting popular recommendations for server ${serverId}, limit ${limit}, excluding user ${
      excludeUserId || "none"
    }`,
  );

  // Get exclusion settings
  const { excludedUserIds, excludedLibraryIds } =
    await getExclusionSettings(serverId);

  // Get items that are popular (most watched) but exclude items already watched by the current user
  let watchedItemIds: string[] = [];
  let hiddenItemIds: string[] = [];

  if (excludeUserId) {
    const userWatchedItems = await db
      .select({ itemId: sessions.itemId })
      .from(sessions)
      .where(
        and(
          eq(sessions.serverId, serverId),
          eq(sessions.userId, excludeUserId),
          isNotNull(sessions.itemId),
        ),
      )
      .groupBy(sessions.itemId);

    watchedItemIds = userWatchedItems
      .map((w) => w.itemId)
      .filter((id): id is string => id !== null);

    debugLog(`🚫 Excluding ${watchedItemIds.length} already watched items`);

    // Get hidden recommendations for this user
    let hiddenItems: { itemId: string }[] = [];
    try {
      hiddenItems = await db
        .select({ itemId: hiddenRecommendations.itemId })
        .from(hiddenRecommendations)
        .where(
          and(
            eq(hiddenRecommendations.serverId, serverId),
            eq(hiddenRecommendations.userId, excludeUserId),
          ),
        );
    } catch (error) {
      debugLog("Error fetching hidden recommendations:", error);
      hiddenItems = [];
    }

    hiddenItemIds = hiddenItems.map((h) => h.itemId).filter(Boolean);
    debugLog(`🙈 Excluding ${hiddenItemIds.length} hidden items`);
  }

  // Get popular items based on watch count
  const popularItemsQuery = db
    .select({
      item: itemCardSelect,
      watchCount: count(sessions.id).as("watchCount"),
    })
    .from(items)
    .leftJoin(sessions, eq(items.id, sessions.itemId))
    .where(
      and(
        eq(items.serverId, serverId),
        isNull(items.deletedAt),
        eq(items.type, "Movie"),
        isNotNull(items.embedding),
        // Exclude user's watched items if we have a user
        watchedItemIds.length > 0
          ? notInArray(items.id, watchedItemIds)
          : sql`true`,
        // Exclude user's hidden items if we have a user
        hiddenItemIds.length > 0
          ? notInArray(items.id, hiddenItemIds)
          : sql`true`,
        // Exclude items from excluded libraries
        excludedLibraryIds.length > 0
          ? notInArray(items.libraryId, excludedLibraryIds)
          : sql`true`,
        // Exclude sessions from excluded users in the count
        excludedUserIds.length > 0
          ? notInArray(sessions.userId, excludedUserIds)
          : sql`true`,
      ),
    )
    .groupBy(items.id)
    .orderBy(desc(count(sessions.id)))
    .limit(limit);

  const popularItems = await popularItemsQuery;

  debugLog(`📈 Found ${popularItems.length} popular items:`);
  popularItems.slice(0, 5).forEach((item, index) => {
    debugLog(
      `  ${index + 1}. "${item.item.name}" - ${item.watchCount} watches`,
    );
  });
  if (popularItems.length > 5) {
    debugLog(`  ... and ${popularItems.length - 5} more`);
  }

  // Transform to recommendation format (no specific similarity since these are popularity-based)
  return popularItems.map((item) => ({
    item: item.item,
    similarity: 0.5, // Default similarity for popular recommendations
    basedOn: [], // No specific items these are based on
  }));
}

/**
 * Get items similar to a specific item (not user-based)
 */
export const getSimilarItemsForItem = async (
  serverId: string | number,
  itemId: string,
  limit = 10,
): Promise<RecommendationItem[]> => {
  "use cache";
  cacheLife("hours");
  try {
    debugLog(
      `\n🎯 Getting items similar to specific item ${itemId} in server ${serverId}, limit ${limit}`,
    );

    const serverIdNum = Number(serverId);

    // Get the target item with its embedding
    const targetItem = await db.query.items.findFirst({
      where: and(
        eq(items.id, itemId),
        eq(items.serverId, serverIdNum),
        isNotNull(items.embedding),
      ),
      columns: itemCardWithEmbeddingColumns,
    });

    if (!targetItem || !targetItem.embedding) {
      debugLog(`❌ Target item not found or missing embedding: ${itemId}`);
      return [];
    }

    debugLog(`🎬 Target item: "${targetItem.name}" (${targetItem.type})`);

    // Calculate cosine similarity with other items of the same type
    const similarity = sql<number>`1 - (${cosineDistance(
      items.embedding,
      targetItem.embedding,
    )})`;

    const similarItems = await db
      .select({
        item: itemCardSelect,
        similarity: similarity,
      })
      .from(items)
      .where(
        and(
          eq(items.serverId, serverIdNum),
          isNull(items.deletedAt),
          eq(items.type, targetItem.type), // Same type (Movie, Series, etc.)
          isNotNull(items.embedding),
          sql`${items.id} != ${itemId}`, // Exclude the target item itself
        ),
      )
      .orderBy(desc(similarity))
      .limit(limit * 2); // Get more to filter for quality

    debugLog(`📊 Found ${similarItems.length} potential similar items`);

    // Filter for good similarity scores (threshold can be adjusted)
    const qualifiedSimilarItems = similarItems.filter(
      (result) => Number(result.similarity) > 0.4,
    );

    debugLog(`✅ ${qualifiedSimilarItems.length} items with similarity > 0.4:`);
    qualifiedSimilarItems
      .slice(0, Math.min(5, limit))
      .forEach((result, index) => {
        debugLog(
          `  ${index + 1}. "${result.item.name}" - similarity: ${Number(
            result.similarity,
          ).toFixed(3)}`,
        );
      });

    // Transform to recommendation format
    const recommendations: RecommendationItem[] = qualifiedSimilarItems
      .slice(0, limit)
      .map((result) => ({
        item: result.item,
        similarity: Number(result.similarity),
        basedOn: [
          stripEmbedding(targetItem as RecommendationCardItemWithEmbedding),
        ], // Based on the target item
      }));

    debugLog(`\n🎉 Returning ${recommendations.length} similar items`);
    return recommendations;
  } catch (error) {
    debugLog("❌ Error getting similar items for item:", error);
    return [];
  }
};

export const hideRecommendation = async (
  serverId: string | number,
  itemId: string,
) => {
  try {
    // Get the current user
    const currentUser = await getMe();
    if (!currentUser || currentUser.serverId !== Number(serverId)) {
      return {
        success: false,
        error: "User not found or not authorized for this server",
      };
    }

    const serverIdNum = Number(serverId);

    // Check if the recommendation is already hidden
    const existingHidden = await db
      .select()
      .from(hiddenRecommendations)
      .where(
        and(
          eq(hiddenRecommendations.serverId, serverIdNum),
          eq(hiddenRecommendations.userId, currentUser.id),
          eq(hiddenRecommendations.itemId, itemId),
        ),
      )
      .limit(1);

    if (existingHidden.length > 0) {
      return {
        success: true,
        error: false,
        message: "Recommendation already hidden",
      };
    }

    // Insert the hidden recommendation
    await db.insert(hiddenRecommendations).values({
      serverId: serverIdNum,
      userId: currentUser.id,
      itemId: itemId,
    });

    // Revalidate recommendations cache
    await revalidateRecommendations(serverIdNum, currentUser.id);

    return {
      success: true,
      error: false,
      message: "Recommendation hidden successfully",
    };
  } catch (error) {
    debugLog("Error hiding recommendation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
