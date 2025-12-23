"use client";

import { AlertTriangle, CheckCircle, Database, RefreshCw } from "lucide-react";
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

interface SyncManagerProps {
  serverId: number;
  serverName: string;
}

export function SyncManager({ serverId }: SyncManagerProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    message: string;
    timestamp: Date;
  } | null>(null);

  const handleTriggerFullSync = async () => {
    setIsTriggering(true);
    setLastSyncResult(null);

    try {
      const response = await fetch("/api/jobs/trigger-full-sync", {
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

      setLastSyncResult({
        success: true,
        message: data.message || "Full sync triggered successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to trigger full sync";

      setLastSyncResult({
        success: false,
        message: errorMessage,
        timestamp: new Date(),
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Synchronization
        </CardTitle>
        <CardDescription>
          Manually trigger a complete sync of all data from your Jellyfin server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            A full sync will update:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Users and permissions</li>
            <li>• Media libraries and collections</li>
            <li>• All media items and metadata</li>
            <li>• Activity and playback history</li>
          </ul>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleTriggerFullSync}
            disabled={isTriggering}
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw
              className={`h-4 w-4 ${isTriggering ? "animate-spin" : ""}`}
            />
            {isTriggering ? "Triggering Sync..." : "Start Full Sync"}
          </Button>
        </div>

        {lastSyncResult && (
          <Alert
            variant={lastSyncResult.success ? "default" : "destructive"}
            className="mt-4"
          >
            {lastSyncResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="space-y-1">
              <div>{lastSyncResult.message}</div>
              <div className="text-xs opacity-75">
                {lastSyncResult.timestamp.toLocaleString()}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 border rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Full syncs can take several minutes to hours
            depending on your library size. The sync will run in the background
            and you can monitor progress from the dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
