import type { Item } from "@streamystats/database/schema";
import type { ItemUserStats } from "@/lib/db/items";

export interface SeriesEpisodeStats {
  totalSeasons: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  watchedSeasons: number;
}

export interface ItemDetailsResponse {
  item: Item;
  totalViews: number;
  totalWatchTime: number;
  completionRate: number;
  firstWatched: string | null;
  lastWatched: string | null;
  usersWatched: ItemUserStats[];
  watchHistory: unknown[];
  watchCountByMonth: unknown[];
  episodeStats?: SeriesEpisodeStats;
}
