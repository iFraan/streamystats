"use client";

import type { Item } from "@streamystats/database/schema";
import {
  BarChart3,
  Percent,
  Tag,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateUS, formatDuration } from "@/lib/utils";
import type { ItemDetailsResponse } from "./types";
import { ViewerDetailsDialog } from "./ViewerDetailsDialog";

interface ItemMetadataProps {
  item: Item;
  statistics: ItemDetailsResponse;
  isAdmin?: boolean;
  serverId: number;
  itemId: string;
}

function formatDateOnlyUS(date: string | Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function KeyValueRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={valueClassName ?? "text-sm text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export function ItemMetadata({
  item,
  statistics,
  isAdmin = false,
  serverId,
  itemId,
}: ItemMetadataProps) {
  const [showViewersDialog, setShowViewersDialog] = useState(false);
  const {
    totalViews,
    totalWatchTime,
    completionRate,
    firstWatched,
    lastWatched,
    usersWatched,
  } = statistics;

  const canViewAnalytics = isAdmin && usersWatched.length > 0;
  const openViewersDialog = useCallback(() => {
    setShowViewersDialog(true);
  }, []);

  const genres = useMemo(() => item.genres ?? [], [item.genres]);
  const tags = useMemo(() => item.tags ?? [], [item.tags]);
  const hasAbout =
    Boolean(item.overview) || genres.length > 0 || tags.length > 0;

  return (
    <>
      <div className="space-y-6">
        {hasAbout && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {item.overview && (
                  <p className="lg:col-span-2 text-sm leading-relaxed text-muted-foreground">
                    {item.overview}
                  </p>
                )}
                <div className="space-y-4">
                  {genres.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        Genres
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Stats
                </CardTitle>
                {canViewAnalytics && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openViewersDialog}
                    className="h-9 w-9 hover:bg-muted"
                    title="View detailed analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatTile label="Views" value={totalViews} />
                <StatTile
                  label="Watch time"
                  value={formatDuration(totalWatchTime)}
                />
                <StatTile
                  label="Avg completion"
                  value={`${completionRate.toFixed(1)}%`}
                  icon={<Percent className="w-4 h-4" />}
                />
                {canViewAnalytics ? (
                  <Button
                    variant="outline"
                    className="h-auto justify-between px-4 py-3"
                    onClick={openViewersDialog}
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Unique viewers
                    </div>
                    <div className="text-xl font-semibold text-foreground">
                      {usersWatched.length}
                    </div>
                  </Button>
                ) : (
                  <StatTile
                    label="Unique viewers"
                    value={usersWatched.length}
                    icon={<Users className="w-4 h-4" />}
                  />
                )}
              </div>

              {item.type === "Series" && statistics.episodeStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StatTile
                    label="Seasons"
                    value={`${statistics.episodeStats.watchedSeasons}/${statistics.episodeStats.totalSeasons}`}
                  />
                  <StatTile
                    label="Episodes"
                    value={`${statistics.episodeStats.watchedEpisodes}/${statistics.episodeStats.totalEpisodes}`}
                  />
                </div>
              )}

              <div className="space-y-2">
                <KeyValueRow
                  label="First watched"
                  value={formatDateUS(firstWatched)}
                />
                <KeyValueRow
                  label="Last watched"
                  value={formatDateUS(lastWatched)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <KeyValueRow
                label="Premiere"
                value={
                  item.premiereDate
                    ? formatDateOnlyUS(item.premiereDate)
                    : undefined
                }
              />
              <KeyValueRow
                label="Container"
                value={
                  item.container ? item.container.toUpperCase() : undefined
                }
              />
              <KeyValueRow
                label="Resolution"
                value={
                  item.width && item.height ? (
                    <Badge variant="outline">
                      {item.width}×{item.height}
                    </Badge>
                  ) : undefined
                }
              />
              <KeyValueRow
                label="Subtitles"
                value={
                  item.hasSubtitles === null ? undefined : (
                    <Badge
                      variant={item.hasSubtitles ? "default" : "secondary"}
                    >
                      {item.hasSubtitles ? "Available" : "None"}
                    </Badge>
                  )
                }
              />
              <KeyValueRow
                label="Video type"
                value={
                  item.videoType ? (
                    <Badge variant="outline">{item.videoType}</Badge>
                  ) : undefined
                }
              />
              <KeyValueRow
                label="Path"
                value={item.path ?? undefined}
                valueClassName="text-xs font-mono text-muted-foreground break-all text-right"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ViewerDetailsDialog
        isOpen={showViewersDialog}
        onOpenChange={setShowViewersDialog}
        serverId={serverId}
        itemId={itemId}
      />
    </>
  );
}
