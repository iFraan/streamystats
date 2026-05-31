"use server";

import "server-only";

import {
  db,
  type Item,
  items,
  sessions,
  userEmbeddings,
} from "@streamystats/database";
import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import type {
  SimilarityExplorerSortOrder,
  SimilarityExplorerType,
  SimilarityExplorerWatched,
} from "@/app/(app)/servers/[id]/(auth)/dashboard/similarity/similarity-explorer";
import { getStatisticsExclusions } from "./exclusions";

const PER_PAGE = 20;

const similarityExplorerItemSelect = {
  id: items.id,
  name: items.name,
  type: items.type,
  productionYear: items.productionYear,
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
  imageBlurHashes: items.imageBlurHashes,
} as const;

export type SimilarityExplorerCardItem = Pick<
  Item,
  | "id"
  | "name"
  | "type"
  | "productionYear"
  | "primaryImageTag"
  | "primaryImageThumbTag"
  | "primaryImageLogoTag"
  | "backdropImageTags"
  | "seriesId"
  | "seriesPrimaryImageTag"
  | "parentBackdropItemId"
  | "parentBackdropImageTags"
  | "parentThumbItemId"
  | "parentThumbImageTag"
  | "imageBlurHashes"
>;

export interface SimilarityExplorerItem {
  item: SimilarityExplorerCardItem;
  similarity: number;
  watched: boolean;
}

export interface SimilarityExplorerResponse {
  data: SimilarityExplorerItem[];
  hasEmbeddedItems: boolean;
  page: number;
  perPage: number;
  status: "ready" | "missing-profile";
  totalItems: number;
  totalPages: number;
}

function emptyResponse({
  page,
  status,
}: {
  page: number;
  status: SimilarityExplorerResponse["status"];
}): SimilarityExplorerResponse {
  return {
    data: [],
    hasEmbeddedItems: false,
    page,
    perPage: PER_PAGE,
    status,
    totalItems: 0,
    totalPages: 0,
  };
}

export async function getSimilarityExplorerItems({
  serverId,
  userId,
  viewerUserId,
  page,
  search,
  sortOrder,
  type,
  watched,
}: {
  serverId: number;
  userId: string;
  viewerUserId?: string;
  page: number;
  search: string;
  sortOrder: SimilarityExplorerSortOrder;
  type: SimilarityExplorerType;
  watched: SimilarityExplorerWatched;
}): Promise<SimilarityExplorerResponse> {
  const userProfile = await db
    .select({ embedding: userEmbeddings.embedding })
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.serverId, serverId),
        eq(userEmbeddings.userId, userId),
      ),
    )
    .limit(1);

  const profileVector = userProfile[0]?.embedding;
  if (!profileVector) {
    return emptyResponse({ page, status: "missing-profile" });
  }

  const { itemLibraryExclusion } = await getStatisticsExclusions(
    serverId,
    viewerUserId,
  );
  const watchedItems = db
    .selectDistinct({ itemId: sessions.itemId })
    .from(sessions)
    .where(
      and(
        eq(sessions.serverId, serverId),
        eq(sessions.userId, userId),
        isNotNull(sessions.itemId),
      ),
    )
    .union(
      db
        .selectDistinct({ itemId: sessions.seriesId })
        .from(sessions)
        .where(
          and(
            eq(sessions.serverId, serverId),
            eq(sessions.userId, userId),
            isNotNull(sessions.seriesId),
          ),
        ),
    )
    .as("watched_items");
  const similarity = sql<number>`1 - (${cosineDistance(
    items.embedding,
    profileVector,
  )})`;
  const conditions: SQL[] = [
    eq(items.serverId, serverId),
    inArray(items.type, ["Movie", "Series"]),
    isNull(items.deletedAt),
    isNotNull(items.embedding),
  ];

  if (itemLibraryExclusion) {
    conditions.push(itemLibraryExclusion);
  }
  if (search) {
    conditions.push(ilike(items.name, `%${search}%`));
  }
  if (type !== "all") {
    conditions.push(eq(items.type, type));
  }
  if (watched === "watched") {
    conditions.push(isNotNull(watchedItems.itemId));
  } else if (watched === "unwatched") {
    conditions.push(isNull(watchedItems.itemId));
  }

  const baseConditions: SQL[] = [
    eq(items.serverId, serverId),
    inArray(items.type, ["Movie", "Series"]),
    isNull(items.deletedAt),
    isNotNull(items.embedding),
  ];
  if (itemLibraryExclusion) {
    baseConditions.push(itemLibraryExclusion);
  }

  const orderBy =
    sortOrder === "asc"
      ? desc(cosineDistance(items.embedding, profileVector))
      : asc(cosineDistance(items.embedding, profileVector));
  const offset = (page - 1) * PER_PAGE;

  const [rows, totalRows, embeddedRows] = await Promise.all([
    db
      .select({
        item: similarityExplorerItemSelect,
        similarity,
        watched: sql<boolean>`${watchedItems.itemId} IS NOT NULL`.as("watched"),
      })
      .from(items)
      .leftJoin(watchedItems, eq(watchedItems.itemId, items.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(PER_PAGE)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(items)
      .leftJoin(watchedItems, eq(watchedItems.itemId, items.id))
      .where(and(...conditions)),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(items)
      .where(and(...baseConditions)),
  ]);

  const totalItems = Number(totalRows[0]?.count ?? 0);

  return {
    data: rows.map((row) => ({
      item: row.item,
      similarity: Number(row.similarity),
      watched: row.watched,
    })),
    hasEmbeddedItems: Number(embeddedRows[0]?.count ?? 0) > 0,
    page,
    perPage: PER_PAGE,
    status: "ready",
    totalItems,
    totalPages: Math.ceil(totalItems / PER_PAGE),
  };
}
