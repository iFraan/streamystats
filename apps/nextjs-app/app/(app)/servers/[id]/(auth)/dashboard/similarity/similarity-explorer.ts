import { getTasteSimilarityBadge } from "@/app/(app)/servers/[id]/(auth)/library/[itemId]/taste-similarity";

export type SimilarityExplorerSortOrder = "asc" | "desc";
export type SimilarityExplorerType = "all" | "Movie" | "Series";
export type SimilarityExplorerWatched = "all" | "watched" | "unwatched";

export interface SimilarityExplorerSearchParams {
  page?: string;
  search?: string;
  sort_order?: string;
  type?: string;
  watched?: string;
  userId?: string;
}

export interface NormalizedSimilarityExplorerParams {
  page: number;
  search: string;
  sortOrder: SimilarityExplorerSortOrder;
  type: SimilarityExplorerType;
  watched: SimilarityExplorerWatched;
  requestedUserId: string | undefined;
}

function isSimilarityExplorerType(
  value: string | undefined,
): value is SimilarityExplorerType {
  return value === "Movie" || value === "Series";
}

function isSimilarityExplorerWatched(
  value: string | undefined,
): value is SimilarityExplorerWatched {
  return value === "watched" || value === "unwatched";
}

export function normalizeSimilarityExplorerParams(
  params: SimilarityExplorerSearchParams,
): NormalizedSimilarityExplorerParams {
  const parsedPage = Number.parseInt(params.page ?? "", 10);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    search: params.search?.trim() ?? "",
    sortOrder: params.sort_order === "asc" ? "asc" : "desc",
    type: isSimilarityExplorerType(params.type) ? params.type : "all",
    watched: isSimilarityExplorerWatched(params.watched)
      ? params.watched
      : "all",
    requestedUserId: params.userId || undefined,
  };
}

export function resolveSimilarityExplorerUserId({
  currentUserId,
  isAdmin,
  requestedUserId,
  serverUserIds,
}: {
  currentUserId: string;
  isAdmin: boolean;
  requestedUserId: string | undefined;
  serverUserIds: string[];
}): string {
  if (isAdmin && requestedUserId && serverUserIds.includes(requestedUserId)) {
    return requestedUserId;
  }

  return currentUserId;
}

export function formatSimilarityPercentage(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

export function getSimilarityExplorerBadge(similarity: number) {
  const badge = getTasteSimilarityBadge(similarity);

  return {
    className: badge?.className ?? "",
    label: formatSimilarityPercentage(similarity),
  };
}
