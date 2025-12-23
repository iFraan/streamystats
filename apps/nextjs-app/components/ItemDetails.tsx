"use client";

import type { Item } from "@/lib/types";

interface WatchHistoryItem {
  id: number;
  user_id: number;
  user_name: string;
  jellyfin_user_id: string;
  start_time: string;
  play_duration: number;
  percent_complete: number;
  completed: boolean;
  client_name: string;
  device_name: string;
}

interface UserWatched {
  user_id: number;
  jellyfin_user_id: string;
  user_name: string;
  view_count: number;
  total_watch_time: number;
  last_watched: string;
}

interface MonthlyStats {
  month: string;
  view_count: number;
  total_watch_time: number;
}

export interface ItemStatistics {
  item: Item;
  total_views: number;
  total_watch_time: number;
  completion_rate: number;
  first_watched: string | null;
  last_watched: string | null;
  users_watched: UserWatched[];
  watch_history: WatchHistoryItem[];
  watch_count_by_month: MonthlyStats[];
}

interface Props {
  item: Item;
  statistics: ItemStatistics;
}

export const ItemDetails: React.FC<Props> = ({
  item,
  statistics: _statistics,
}) => {
  return <div className="space-y-6">{item.name}</div>;
};
