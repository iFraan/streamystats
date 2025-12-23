"use client";

import {
  AlertTriangle,
  CheckCircle,
  Library,
  Loader,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
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

interface LibrarySyncManagerProps {
  serverId: number;
}

interface LibraryData {
  id: string;
  name: string;
  type: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

export function LibrarySyncManager({ serverId }: LibrarySyncManagerProps) {
  const [libraries, setLibraries] = useState<LibraryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingLibraries, setSyncingLibraries] = useState<Set<string>>(
    new Set(),
  );
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(
    new Map(),
  );

  useEffect(() => {
    const loadLibraries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/libraries?serverId=${serverId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setLibraries(data.libraries || []);
      } catch (error) {
        console.error("Error loading libraries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLibraries();
  }, [serverId]);

  const handleSyncLibrary = async (libraryId: string, libraryName: string) => {
    setSyncingLibraries((prev) => new Set(prev).add(libraryId));
    setSyncResults((prev) => {
      const newMap = new Map(prev);
      newMap.delete(libraryId);
      return newMap;
    });

    try {
      const response = await fetch("/api/jobs/trigger-library-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverId, libraryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      setSyncResults((prev) => {
        const newMap = new Map(prev);
        newMap.set(libraryId, {
          success: true,
          message: data.message || `Sync triggered for ${libraryName}`,
          timestamp: new Date(),
        });
        return newMap;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to trigger library sync";

      setSyncResults((prev) => {
        const newMap = new Map(prev);
        newMap.set(libraryId, {
          success: false,
          message: errorMessage,
          timestamp: new Date(),
        });
        return newMap;
      });
    } finally {
      setSyncingLibraries((prev) => {
        const newSet = new Set(prev);
        newSet.delete(libraryId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Library Sync
          </CardTitle>
          <CardDescription>
            Sync individual libraries from your Jellyfin server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="h-5 w-5" />
          Library Sync
        </CardTitle>
        <CardDescription>
          Sync individual libraries from your Jellyfin server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {libraries.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No libraries found for this server. Make sure libraries have been
              synced first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {libraries.map((library) => {
              const isSyncing = syncingLibraries.has(library.id);
              const result = syncResults.get(library.id);

              return (
                <div
                  key={library.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{library.name}</p>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                        {library.type}
                      </span>
                    </div>
                    {result && (
                      <Alert
                        variant={result.success ? "default" : "destructive"}
                        className="mt-2"
                      >
                        {result.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertDescription className="text-xs">
                          <div>{result.message}</div>
                          <div className="opacity-75 mt-1">
                            {result.timestamp.toLocaleString()}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSyncLibrary(library.id, library.name)}
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                    className="ml-4 flex items-center gap-2 shrink-0"
                  >
                    {isSyncing ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-muted/50 border rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Library syncs will update all items in the
            selected library. The sync will run in the background and you can
            monitor progress from the dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
