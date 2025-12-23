"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader,
  Trash2,
  Tv,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Server } from "@/lib/types";
import { fetch } from "@/lib/utils";

interface DangerousSeriesMergeManagerProps {
  server: Server;
}

interface EpisodeMatch {
  deletedEpisode: {
    id: string;
    name: string;
    seriesName: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    productionYear: number | null;
    deletedAt: string;
    sessionsCount: number;
  };
  activeEpisode: {
    id: string;
    name: string;
    seriesName: string | null;
    seriesId: string | null;
    seasonId: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
  } | null;
}

interface SeriesGroup {
  seriesName: string;
  productionYear: number | null;
  deletedSeriesId: string | null;
  activeSeriesId: string | null;
  activeSeriesName: string | null;
  episodes: EpisodeMatch[];
  totalSessions: number;
  matchedCount: number;
  unmatchedCount: number;
}

interface MergeResult {
  success: boolean;
  message: string;
  metrics?: {
    episodesMerged: number;
    sessionsMigrated: number;
    hiddenRecommendationsMigrated: number;
  };
  errors?: string[];
}

interface OrphanCleanupResult {
  success: boolean;
  message: string;
  metrics?: {
    seasonsDeleted: number;
    seriesDeleted: number;
  };
}

export function DangerousSeriesMergeManager({
  server,
}: DangerousSeriesMergeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(
    new Set(),
  );
  const [summary, setSummary] = useState<{
    totalDeletedEpisodes: number;
    totalSeries: number;
    totalSessions: number;
    totalMatched: number;
    totalUnmatched: number;
  } | null>(null);
  const [lastResult, setLastResult] = useState<{
    result: MergeResult | OrphanCleanupResult;
    timestamp: Date;
  } | null>(null);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/items/dangerous-matches-series?serverId=${server.id}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch matches");
      }

      setSeriesGroups(data.seriesGroups);
      setSummary(data.summary);
      setSelectedEpisodes(new Set());
      setExpandedSeries(new Set());
    } catch (error) {
      setLastResult({
        result: {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to fetch matches",
        },
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [server.id]);

  const handleOpen = () => {
    setIsOpen(true);
    setLastResult(null);
    fetchMatches();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSeriesGroups([]);
    setSelectedEpisodes(new Set());
    setExpandedSeries(new Set());
    setSummary(null);
  };

  const toggleSeriesExpanded = (seriesKey: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesKey)) {
        next.delete(seriesKey);
      } else {
        next.add(seriesKey);
      }
      return next;
    });
  };

  const toggleEpisode = (episodeId: string) => {
    setSelectedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(episodeId)) {
        next.delete(episodeId);
      } else {
        next.add(episodeId);
      }
      return next;
    });
  };

  const toggleAllInSeries = (group: SeriesGroup) => {
    const matchedEpisodeIds = group.episodes
      .filter((e) => e.activeEpisode)
      .map((e) => e.deletedEpisode.id);

    const allSelected = matchedEpisodeIds.every((id) =>
      selectedEpisodes.has(id),
    );

    setSelectedEpisodes((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of matchedEpisodeIds) {
          next.delete(id);
        }
      } else {
        for (const id of matchedEpisodeIds) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectAllMatched = () => {
    const allMatchedIds = seriesGroups.flatMap((g) =>
      g.episodes.filter((e) => e.activeEpisode).map((e) => e.deletedEpisode.id),
    );
    setSelectedEpisodes(new Set(allMatchedIds));
  };

  const handleMergeSelected = async () => {
    if (selectedEpisodes.size === 0) return;

    setIsMerging(true);
    try {
      const pairs = seriesGroups
        .flatMap((g) => g.episodes)
        .flatMap((e) =>
          selectedEpisodes.has(e.deletedEpisode.id) && e.activeEpisode
            ? [
                {
                  deletedEpisodeId: e.deletedEpisode.id,
                  activeEpisodeId: e.activeEpisode.id,
                },
              ]
            : [],
        );

      const response = await fetch("/api/items/merge-episodes-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs }),
      });

      const data = await response.json();

      setLastResult({
        result: data,
        timestamp: new Date(),
      });

      if (data.success || data.metrics?.episodesMerged > 0) {
        fetchMatches();
      }
    } catch (error) {
      setLastResult({
        result: {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to merge episodes",
        },
        timestamp: new Date(),
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleCleanupOrphans = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetch("/api/items/cleanup-orphaned-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: server.id }),
      });

      const data = await response.json();

      setLastResult({
        result: data,
        timestamp: new Date(),
      });
    } catch (error) {
      setLastResult({
        result: {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to cleanup orphans",
        },
        timestamp: new Date(),
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const getSeriesKey = (group: SeriesGroup) =>
    `${group.seriesName}:${group.productionYear}`;

  const formatEpisodeCode = (
    seasonNumber: number | null,
    episodeNumber: number | null,
  ) => {
    const s = seasonNumber?.toString().padStart(2, "0") ?? "??";
    const e = episodeNumber?.toString().padStart(2, "0") ?? "??";
    return `S${s}E${e}`;
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Tv className="h-5 w-5" />
            Dangerous: Merge Re-added Series
          </CardTitle>
          <CardDescription>
            Find and merge deleted TV series episodes with new episodes that
            have the same series name, season, and episode number. This matches
            without provider IDs and may cause incorrect merges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>
                - Find deleted episodes matching active episodes by series name
                + S##E##
              </li>
              <li>- Migrate watch sessions from deleted to active episodes</li>
              <li>- Delete the old episodes</li>
              <li>- Optionally cleanup orphaned seasons and series</li>
            </ul>
          </div>

          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              Warning: This operation is dangerous and may merge incorrect
              items. Only use if you understand the risks.
            </p>
          </div>

          <Button
            onClick={handleOpen}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Tv className="h-4 w-4" />
            Find Series Matches
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!w-auto !max-w-[min(90rem,95vw)] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dangerous Merge: Series Episodes by Name
            </DialogTitle>
            <DialogDescription>
              Select episodes to merge. Deleted episodes will have their watch
              history transferred to the matching active episode.
            </DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">{summary.totalSeries} series</Badge>
              <Badge variant="outline">
                {summary.totalDeletedEpisodes} deleted episodes
              </Badge>
              <Badge variant="secondary">{summary.totalMatched} matched</Badge>
              <Badge variant="destructive">
                {summary.totalUnmatched} unmatched
              </Badge>
              <Badge variant="default">{summary.totalSessions} sessions</Badge>
            </div>
          )}

          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : seriesGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4" />
                <p>No deleted series episodes found</p>
                <p className="text-sm">
                  All deleted episodes have been processed or no matches exist.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {seriesGroups.map((group) => {
                  const seriesKey = getSeriesKey(group);
                  const isExpanded = expandedSeries.has(seriesKey);
                  const matchedEpisodes = group.episodes.filter(
                    (e) => e.activeEpisode,
                  );
                  const allSelected = matchedEpisodes.every((e) =>
                    selectedEpisodes.has(e.deletedEpisode.id),
                  );
                  const someSelected = matchedEpisodes.some((e) =>
                    selectedEpisodes.has(e.deletedEpisode.id),
                  );

                  return (
                    <Collapsible
                      key={seriesKey}
                      open={isExpanded}
                      onOpenChange={() => toggleSeriesExpanded(seriesKey)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-3 p-3 hover:bg-muted/50">
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllInSeries(group);
                              }}
                            >
                              <Checkbox
                                checked={allSelected}
                                className={
                                  someSelected && !allSelected
                                    ? "data-[state=checked]:bg-muted"
                                    : ""
                                }
                                disabled={matchedEpisodes.length === 0}
                              />
                            </button>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="flex-1 text-left">
                              <span className="font-medium">
                                {group.seriesName}
                              </span>
                              {group.productionYear && (
                                <span className="text-muted-foreground ml-2">
                                  ({group.productionYear})
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {group.episodes.length} eps
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {group.matchedCount} matched
                              </Badge>
                              {group.unmatchedCount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {group.unmatchedCount} unmatched
                                </Badge>
                              )}
                              <Badge className="text-xs">
                                {group.totalSessions} sessions
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  <th className="w-10 p-2" />
                                  <th className="text-left p-2">Episode</th>
                                  <th className="text-left p-2">
                                    Deleted Episode
                                  </th>
                                  <th className="text-center p-2">Sessions</th>
                                  <th className="text-center p-2">→</th>
                                  <th className="text-left p-2">
                                    Active Episode
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.episodes.map((ep) => (
                                  <tr
                                    key={ep.deletedEpisode.id}
                                    className={`border-b last:border-0 ${
                                      !ep.activeEpisode
                                        ? "bg-destructive/5"
                                        : ""
                                    }`}
                                  >
                                    <td className="p-2">
                                      <Checkbox
                                        checked={selectedEpisodes.has(
                                          ep.deletedEpisode.id,
                                        )}
                                        onCheckedChange={() =>
                                          toggleEpisode(ep.deletedEpisode.id)
                                        }
                                        disabled={!ep.activeEpisode}
                                      />
                                    </td>
                                    <td className="p-2 font-mono text-xs">
                                      {formatEpisodeCode(
                                        ep.deletedEpisode.seasonNumber,
                                        ep.deletedEpisode.episodeNumber,
                                      )}
                                    </td>
                                    <td className="p-2">
                                      <div className="max-w-[200px]">
                                        <p className="truncate">
                                          {ep.deletedEpisode.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                          {ep.deletedEpisode.id.slice(0, 8)}...
                                        </p>
                                      </div>
                                    </td>
                                    <td className="p-2 text-center">
                                      <span
                                        className={
                                          ep.deletedEpisode.sessionsCount > 0
                                            ? "text-green-600 font-medium"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        {ep.deletedEpisode.sessionsCount}
                                      </span>
                                    </td>
                                    <td className="p-2 text-center text-muted-foreground">
                                      →
                                    </td>
                                    <td className="p-2">
                                      {ep.activeEpisode ? (
                                        <div className="max-w-[200px]">
                                          <p className="truncate">
                                            {ep.activeEpisode.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-mono truncate">
                                            {ep.activeEpisode.id.slice(0, 8)}...
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-destructive text-xs">
                                          No match found
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>

          {lastResult && (
            <Alert
              variant={lastResult.result.success ? "default" : "destructive"}
            >
              {lastResult.result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="space-y-2">
                <div>{lastResult.result.message}</div>
                {lastResult.result.metrics && (
                  <div className="text-xs space-y-1 opacity-80">
                    {"episodesMerged" in lastResult.result.metrics && (
                      <>
                        <div>
                          Episodes merged:{" "}
                          {lastResult.result.metrics.episodesMerged}
                        </div>
                        <div>
                          Sessions migrated:{" "}
                          {lastResult.result.metrics.sessionsMigrated}
                        </div>
                      </>
                    )}
                    {"seasonsDeleted" in lastResult.result.metrics && (
                      <>
                        <div>
                          Seasons deleted:{" "}
                          {lastResult.result.metrics.seasonsDeleted}
                        </div>
                        <div>
                          Series deleted:{" "}
                          {lastResult.result.metrics.seriesDeleted}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {"errors" in lastResult.result &&
                  lastResult.result.errors &&
                  lastResult.result.errors.length > 0 && (
                    <div className="text-xs text-destructive">
                      Errors: {lastResult.result.errors.slice(0, 3).join(", ")}
                      {lastResult.result.errors.length > 3 &&
                        ` (+${lastResult.result.errors.length - 3} more)`}
                    </div>
                  )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="border-t pt-4 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isMerging || isCleaningUp}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={selectAllMatched}
              disabled={isMerging || isCleaningUp || !summary?.totalMatched}
            >
              Select All Matched
            </Button>
            <Button
              variant="secondary"
              onClick={handleCleanupOrphans}
              disabled={isMerging || isCleaningUp}
              className="flex items-center gap-2"
            >
              {isCleaningUp ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Cleanup Orphans
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMergeSelected}
              disabled={
                selectedEpisodes.size === 0 || isMerging || isCleaningUp
              }
            >
              {isMerging ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Merging...
                </>
              ) : (
                `Merge ${selectedEpisodes.size} Selected`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
