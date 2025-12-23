import type { Item, User } from "@streamystats/database/schema";
import { toast } from "sonner";
import { fetch } from "@/lib/utils";

export type ActiveSession = {
  sessionKey: string;
  user: User | null;
  item: Item;
  client: string;
  deviceName: string;
  deviceId: string;
  positionTicks: number;
  formattedPosition: string;
  runtimeTicks: number;
  formattedRuntime: string;
  progressPercent: number;
  playbackDuration: number;
  lastActivityDate: string | null;
  isPaused: boolean;
  playMethod: string | null;
  transcodingInfo?: {
    videoCodec: string;
    audioCodec: string;
    container: string;
    isVideoDirect: boolean;
    isAudioDirect: boolean;
    bitrate: number;
    width: number;
    height: number;
    audioChannels: number;
    hardwareAccelerationType: string;
    transcodeReasons: string[];
  };
  ipAddress?: string;
};

export const getActiveSessions = async (
  serverId: number,
): Promise<ActiveSession[]> => {
  try {
    const response = await fetch(`/api/Sessions?serverId=${serverId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      let errorPayload: unknown;
      try {
        errorPayload = await response.json();
      } catch (_e) {
        // ignore
      }

      const payloadObj =
        typeof errorPayload === "object" && errorPayload !== null
          ? (errorPayload as Record<string, unknown>)
          : undefined;

      const errorMessage =
        typeof payloadObj?.error === "string"
          ? payloadObj.error
          : `Error fetching sessions: ${response.statusText || response.status}`;

      const isJellyfinConnectivityIssue =
        response.headers.get("x-server-connectivity-error") === "true" ||
        payloadObj?.server_connectivity_issue === true;

      const isDatabaseError =
        response.headers.get("x-database-error") === "true" ||
        payloadObj?.database_error === true;

      toast.error(
        isDatabaseError
          ? "Database Error"
          : isJellyfinConnectivityIssue
            ? "Jellyfin Connectivity Issue"
            : "Active Sessions Error",
        {
          id: "jellyfin-sessions-error",
          description: errorMessage,
          duration: Infinity,
        },
      );

      return [];
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Expected array but got:", data);
      return [];
    }

    // On success, dismiss any previous session error toast.
    toast.dismiss("jellyfin-sessions-error");
    return data as ActiveSession[];
  } catch (err) {
    console.error("Failed to fetch active sessions:", err);
    toast.error("Active Sessions Error", {
      id: "jellyfin-sessions-error",
      description:
        err instanceof Error
          ? err.message
          : "Cannot retrieve active sessions at this time.",
      duration: Infinity,
    });
    return [];
  }
};
