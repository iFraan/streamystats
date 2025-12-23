"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  GitMerge,
  Loader,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Item, Server } from "@/lib/types";
import { fetch } from "@/lib/utils";
import { Poster } from "../dashboard/Poster";

interface MergeItemsManagerProps {
  server: Server;
}

interface MergeResult {
  success: boolean;
  message: string;
  metrics?: {
    sessionsMigrated: number;
    hiddenRecommendationsMigrated: number;
  };
}

interface PreviewItem {
  id: string;
  item: Item | null;
}

export function MergeItemsManager({ server }: MergeItemsManagerProps) {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [previewItems, setPreviewItems] = useState<{
    left: PreviewItem | null;
    right: PreviewItem | null;
  }>({ left: null, right: null });
  const [lastResult, setLastResult] = useState<{
    result: MergeResult;
    timestamp: Date;
  } | null>(null);

  const handlePreview = async () => {
    if (!leftId.trim() || !rightId.trim()) {
      setLastResult({
        result: {
          success: false,
          message: "Both item IDs are required",
        },
        timestamp: new Date(),
      });
      return;
    }

    if (leftId.trim() === rightId.trim()) {
      setLastResult({
        result: {
          success: false,
          message: "Left and right IDs must be different",
        },
        timestamp: new Date(),
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/items/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemIds: [leftId.trim(), rightId.trim()],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const leftItem = data.items.find(
        (i: PreviewItem) => i.id === leftId.trim(),
      );
      const rightItem = data.items.find(
        (i: PreviewItem) => i.id === rightId.trim(),
      );

      if (!leftItem?.item) {
        throw new Error(`Left item with ID ${leftId} not found`);
      }

      if (!rightItem?.item) {
        throw new Error(`Right item with ID ${rightId} not found`);
      }

      if (leftItem.item.serverId !== rightItem.item.serverId) {
        throw new Error("Items must be from the same server");
      }

      setPreviewItems({ left: leftItem, right: rightItem });
      setShowConfirmDialog(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch items";

      setLastResult({
        result: {
          success: false,
          message: errorMessage,
        },
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    setIsMerging(true);

    try {
      const response = await fetch("/api/items/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leftId: leftId.trim(),
          rightId: rightId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      setLastResult({
        result: data,
        timestamp: new Date(),
      });

      setLeftId("");
      setRightId("");
      setShowConfirmDialog(false);
      setPreviewItems({ left: null, right: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to merge items";

      setLastResult({
        result: {
          success: false,
          message: errorMessage,
        },
        timestamp: new Date(),
      });
      setShowConfirmDialog(false);
    } finally {
      setIsMerging(false);
    }
  };

  const formatItemInfo = (item: Item) => {
    const parts = [item.type];
    if (item.productionYear) parts.push(`(${item.productionYear})`);
    if (item.type === "Episode" && item.seriesName) {
      parts.unshift(item.seriesName);
      if (item.parentIndexNumber !== null && item.indexNumber !== null) {
        parts.push(`S${item.parentIndexNumber}E${item.indexNumber}`);
      }
    }
    return parts.join(" ");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Merge Items
          </CardTitle>
          <CardDescription>
            Merge two items by converting the left item into the right item.
            Watch stats and other data will be migrated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">This will:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>- Migrate all watch sessions from left item to right item</li>
              <li>
                - Migrate hidden recommendations from left item to right item
              </li>
              <li>- Delete the left item from the database</li>
              <li>- Preserve all watch statistics and history</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-row gap-2 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="left-id">Left Item ID (source)</Label>
              <Input
                id="left-id"
                placeholder="Enter item ID to merge from"
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                disabled={isLoading || isMerging}
              />
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="right-id">Right Item ID (target)</Label>
              <Input
                id="right-id"
                placeholder="Enter item ID to merge into"
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                disabled={isLoading || isMerging}
              />
            </div>

            <Button
              onClick={handlePreview}
              disabled={
                isLoading || isMerging || !leftId.trim() || !rightId.trim()
              }
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <GitMerge className="h-4 w-4" />
              )}
              {isLoading ? "Loading..." : "Merge Items"}
            </Button>
          </div>

          {lastResult && (
            <Alert
              variant={lastResult.result.success ? "default" : "destructive"}
              className="mt-4"
            >
              {lastResult.result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="space-y-2">
                <div>{lastResult.result.message}</div>

                {lastResult.result.metrics && (
                  <div className="text-xs space-y-1 mt-2 opacity-80">
                    <div className="grid grid-cols-2 gap-x-4">
                      <span>Sessions migrated:</span>
                      <span>
                        {lastResult.result.metrics.sessionsMigrated.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <span>Hidden recommendations migrated:</span>
                      <span>
                        {lastResult.result.metrics.hiddenRecommendationsMigrated.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs opacity-75">
                  {lastResult.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This operation merges the left item into
              the right item. The left item will be permanently deleted and all
              its watch history and recommendations will be transferred to the
              right item. Both items must exist and be from the same server.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="!w-auto !max-w-[min(64rem,95vw)] overflow-x-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Item Merge
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to merge these items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col md:flex-row items-center gap-4 py-4 min-w-0">
            {previewItems.left?.item && (
              <div className="w-full md:flex-1 md:min-w-0 border rounded-lg p-4 bg-destructive/5">
                <p className="text-xs text-destructive font-medium mb-2">
                  Will be deleted
                </p>
                <div className="flex gap-3">
                  <Poster
                    item={previewItems.left.item}
                    server={server}
                    size="large"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {previewItems.left.item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatItemInfo(previewItems.left.item)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      {previewItems.left.item.id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0 rotate-90 md:rotate-0" />

            {previewItems.right?.item && (
              <div className="w-full md:flex-1 md:min-w-0 border rounded-lg p-4 bg-green-500/5">
                <p className="text-xs text-green-600 font-medium mb-2">
                  Will receive data
                </p>
                <div className="flex gap-3">
                  <Poster
                    item={previewItems.right.item}
                    server={server}
                    size="large"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {previewItems.right.item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatItemInfo(previewItems.right.item)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      {previewItems.right.item.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMerging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMerge}
              disabled={isMerging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isMerging ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Merging...
                </>
              ) : (
                "Confirm Merge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
