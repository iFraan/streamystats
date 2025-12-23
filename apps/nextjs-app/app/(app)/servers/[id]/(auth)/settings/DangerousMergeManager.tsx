"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Server } from "@/lib/types";
import { fetch } from "@/lib/utils";

const ITEMS_PER_PAGE = 25;

interface DangerousMergeManagerProps {
  server: Server;
}

interface DangerousMatch {
  deletedItem: {
    id: string;
    name: string;
    type: string;
    productionYear: number | null;
    deletedAt: string;
  };
  activeItem: {
    id: string;
    name: string;
    type: string;
    productionYear: number | null;
  };
  sessionsCount: number;
}

interface MergeResult {
  success: boolean;
  message: string;
  metrics?: {
    itemsMerged: number;
    sessionsMigrated: number;
    hiddenRecommendationsMigrated: number;
  };
  errors?: string[];
}

export function DangerousMergeManager({ server }: DangerousMergeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isMergingAll, setIsMergingAll] = useState(false);
  const [matches, setMatches] = useState<DangerousMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(
    new Set(),
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });
  const [lastResult, setLastResult] = useState<{
    result: MergeResult;
    timestamp: Date;
  } | null>(null);

  const fetchMatches = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/items/dangerous-matches?serverId=${server.id}&page=${page}&limit=${ITEMS_PER_PAGE}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch matches");
        }

        setMatches(data.matches);
        setPagination(data.pagination);
        setSelectedMatches(new Set());
      } catch (error) {
        setLastResult({
          result: {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to fetch matches",
          },
          timestamp: new Date(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [server.id],
  );

  const handleOpen = () => {
    setIsOpen(true);
    setLastResult(null);
    fetchMatches(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMatches([]);
    setSelectedMatches(new Set());
    setPagination({ page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 });
  };

  const toggleMatch = (deletedItemId: string) => {
    setSelectedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(deletedItemId)) {
        next.delete(deletedItemId);
      } else {
        next.add(deletedItemId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedMatches.size === matches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(matches.map((m) => m.deletedItem.id)));
    }
  };

  const handleMergeSelected = async () => {
    if (selectedMatches.size === 0) return;

    setIsMerging(true);
    try {
      const pairs = matches
        .filter((m) => selectedMatches.has(m.deletedItem.id))
        .map((m) => ({
          deletedItemId: m.deletedItem.id,
          activeItemId: m.activeItem.id,
        }));

      const response = await fetch("/api/items/merge-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs }),
      });

      const data = await response.json();

      setLastResult({
        result: data,
        timestamp: new Date(),
      });

      if (data.success || data.metrics?.itemsMerged > 0) {
        fetchMatches(pagination.page);
      }
    } catch (error) {
      setLastResult({
        result: {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to merge items",
        },
        timestamp: new Date(),
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleMergeAll = async () => {
    setIsMergingAll(true);
    try {
      const response = await fetch("/api/items/merge-all-dangerous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: server.id }),
      });

      const data = await response.json();

      setLastResult({
        result: data,
        timestamp: new Date(),
      });

      if (data.success || data.metrics?.itemsMerged > 0) {
        fetchMatches(1);
      }
    } catch (error) {
      setLastResult({
        result: {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to merge all items",
        },
        timestamp: new Date(),
      });
    } finally {
      setIsMergingAll(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Dangerous: Merge Re-added Items
          </CardTitle>
          <CardDescription>
            Find and merge deleted movies with new movies that have the same
            name and year. This matches without provider IDs and may cause
            incorrect merges. Only works for Movies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>
                - Find deleted movies matching active movies by name + year
              </li>
              <li>- Migrate watch sessions from deleted to active movies</li>
              <li>- Permanently delete the old movies</li>
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
            <AlertTriangle className="h-4 w-4" />
            Find Matches
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!w-auto !max-w-[min(90rem,95vw)] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dangerous Merge: Movies by Name + Year
            </DialogTitle>
            <DialogDescription>
              Select movies to merge. Deleted movies will have their watch
              history transferred to the matching active movie.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4" />
                <p>No matching items found</p>
                <p className="text-sm">
                  All deleted items have been processed or no matches exist.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedMatches.size === matches.length &&
                          matches.length > 0
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Deleted Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Active Item</TableHead>
                    <TableHead>Deleted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.deletedItem.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMatches.has(match.deletedItem.id)}
                          onCheckedChange={() =>
                            toggleMatch(match.deletedItem.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {match.deletedItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {match.deletedItem.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{match.deletedItem.type}</TableCell>
                      <TableCell>{match.deletedItem.productionYear}</TableCell>
                      <TableCell>
                        <span
                          className={
                            match.sessionsCount > 0
                              ? "text-green-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {match.sessionsCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {match.activeItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {match.activeItem.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(match.deletedItem.deletedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-2 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total matches)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMatches(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMatches(pagination.page + 1)}
                  disabled={
                    pagination.page >= pagination.totalPages || isLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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
                    <div>
                      Items merged: {lastResult.result.metrics.itemsMerged}
                    </div>
                    <div>
                      Sessions migrated:{" "}
                      {lastResult.result.metrics.sessionsMigrated}
                    </div>
                  </div>
                )}
                {lastResult.result.errors &&
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
              disabled={isMerging || isMergingAll}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMergeSelected}
              disabled={selectedMatches.size === 0 || isMerging || isMergingAll}
            >
              {isMerging ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Merging...
                </>
              ) : (
                `Merge ${selectedMatches.size} Selected`
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMergeAll}
              disabled={pagination.total === 0 || isMerging || isMergingAll}
            >
              {isMergingAll ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Merging All...
                </>
              ) : (
                `Merge All (${pagination.total})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
