"use client";

import { AlertTriangle, CheckCircle, Loader, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetch } from "@/lib/utils";

interface CleanupMetrics {
  librariesScanned: number;
  itemsScanned: number;
  jellyfinItemsCount: number;
  databaseItemsCount: number;
  itemsSoftDeleted: number;
  itemsMigrated: number;
  sessionsMigrated: number;
  hiddenRecommendationsDeleted: number;
  hiddenRecommendationsMigrated: number;
  duration: number;
  errors: number;
}

interface CleanupManagerProps {
  serverId: number;
}

export function CleanupManager({ serverId }: CleanupManagerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    metrics?: CleanupMetrics;
    timestamp: Date;
  } | null>(null);

  const handleCleanup = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/jobs/cleanup-deleted-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setLastResult({
        success: data.success,
        message: data.message || "Cleanup completed",
        metrics: data.metrics,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to cleanup deleted items";

      setLastResult({
        success: false,
        message: errorMessage,
        timestamp: new Date(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Cleanup Deleted Items
        </CardTitle>
        <CardDescription>
          Detect and remove items that have been deleted from your Jellyfin
          server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">This cleanup will:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>- Compare your database with items currently on Jellyfin</li>
            <li>- Soft-delete items no longer present on the server</li>
            <li>
              - Migrate watch history if items were re-added with different IDs
            </li>
            <li>- Preserve all watch statistics and history</li>
          </ul>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleCleanup}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isRunning ? "Scanning..." : "Start Cleanup"}
          </Button>
        </div>

        {lastResult && (
          <Alert
            variant={lastResult.success ? "default" : "destructive"}
            className="mt-4"
          >
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="space-y-2">
              <div>{lastResult.message}</div>

              {lastResult.metrics && (
                <div className="text-xs space-y-1 mt-2 opacity-80">
                  <div className="grid grid-cols-2 gap-x-4">
                    <span>Items scanned:</span>
                    <span>
                      {lastResult.metrics.itemsScanned.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <span>Items deleted:</span>
                    <span>
                      {lastResult.metrics.itemsSoftDeleted.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <span>Items migrated:</span>
                    <span>
                      {lastResult.metrics.itemsMigrated.toLocaleString()}
                    </span>
                  </div>
                  {lastResult.metrics.sessionsMigrated > 0 && (
                    <div className="grid grid-cols-2 gap-x-4">
                      <span>Sessions migrated:</span>
                      <span>
                        {lastResult.metrics.sessionsMigrated.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4">
                    <span>Duration:</span>
                    <span>{formatDuration(lastResult.metrics.duration)}</span>
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
            <strong>Note:</strong> This operation is safe and preserves all
            watch history. Deleted items are soft-deleted and can be restored if
            the item is re-added to Jellyfin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
