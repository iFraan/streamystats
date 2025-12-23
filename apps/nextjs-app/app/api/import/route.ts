import { db } from "@streamystats/database";
import {
  items,
  type NewSession,
  sessions,
  users,
} from "@streamystats/database/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getServer } from "@/lib/db/server";

// Types for the import data format
interface ExportInfo {
  timestamp: string;
  serverName: string;
  serverId: number;
  version: string;
  exportType: string;
}

interface ImportSession {
  id: string;
  serverId: number;
  userId: string | null;
  itemId: string | null;
  userName: string;
  userServerId: string | null;
  deviceId: string | null;
  deviceName: string | null;
  clientName: string | null;
  applicationVersion: string | null;
  remoteEndPoint: string | null;
  itemName: string | null;
  seriesId: string | null;
  seriesName: string | null;
  seasonId: string | null;
  playDuration: number | null;
  startTime: string | null;
  endTime: string | null;
  lastActivityDate: string | null;
  lastPlaybackCheckIn: string | null;
  runtimeTicks: number | null;
  positionTicks: number | null;
  percentComplete: number | null;
  completed: boolean;
  isPaused: boolean;
  isMuted: boolean;
  isActive: boolean;
  volumeLevel: number | null;
  audioStreamIndex: number | null;
  subtitleStreamIndex: number | null;
  playMethod: string | null;
  mediaSourceId: string | null;
  repeatMode: string | null;
  playbackOrder: string | null;
  videoCodec: string | null;
  audioCodec: string | null;
  resolutionWidth: number | null;
  resolutionHeight: number | null;
  videoBitRate: number | null;
  audioBitRate: number | null;
  audioChannels: number | null;
  audioSampleRate: number | null;
  videoRangeType: string | null;
  isTranscoded: boolean;
  transcodingWidth: number | null;
  transcodingHeight: number | null;
  transcodingVideoCodec: string | null;
  transcodingAudioCodec: string | null;
  transcodingContainer: string | null;
  transcodingIsVideoDirect: boolean | null;
  transcodingIsAudioDirect: boolean | null;
  transcodingBitrate: number | null;
  transcodingCompletionPercentage: number | null;
  transcodingAudioChannels: number | null;
  transcodingHardwareAccelerationType: string | null;
  transcodeReasons: string[] | null;
  rawData: any;
  createdAt: string;
  updatedAt: string;
}

interface ImportData {
  exportInfo: ExportInfo;
  sessions: ImportSession[];
  server: {
    id: number;
    name: string;
    url: string;
    version?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Require admin for data import
    const { error } = await requireAdmin();
    if (error) return error;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const serverId = formData.get("serverId") as string;

    if (!file || !serverId) {
      return NextResponse.json(
        { error: "File and serverId are required" },
        { status: 400 },
      );
    }

    // Validate serverId
    const serverIdNum = Number(serverId);
    if (Number.isNaN(serverIdNum)) {
      return NextResponse.json({ error: "Invalid server ID" }, { status: 400 });
    }

    // Verify the target server exists
    const targetServer = await getServer({ serverId: serverIdNum });
    if (!targetServer) {
      return NextResponse.json(
        { error: "Target server not found" },
        { status: 404 },
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".json")) {
      return NextResponse.json(
        { error: "Only JSON files are supported" },
        { status: 400 },
      );
    }

    // Parse the JSON file
    const fileContent = await file.text();
    let importData: ImportData;

    try {
      importData = JSON.parse(fileContent);
    } catch (_error) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 },
      );
    }

    // Validate the import data structure
    if (
      !importData.exportInfo ||
      !importData.sessions ||
      !Array.isArray(importData.sessions)
    ) {
      return NextResponse.json(
        { error: "Invalid import file format - missing required fields" },
        { status: 400 },
      );
    }

    // Validate export version compatibility
    if (importData.exportInfo.version !== "streamystats-v2") {
      return NextResponse.json(
        {
          error: `Unsupported export version: ${importData.exportInfo.version}. Expected: streamystats-v2`,
        },
        { status: 400 },
      );
    }

    // Validate export type
    if (importData.exportInfo.exportType !== "sessions-only") {
      return NextResponse.json(
        {
          error: `Unsupported export type: ${importData.exportInfo.exportType}. Expected: sessions-only`,
        },
        { status: 400 },
      );
    }

    console.log(
      `Starting import for server ${targetServer.name} (${serverIdNum})`,
    );
    console.log(
      `Import file from: ${importData.server.name} (original ID: ${importData.exportInfo.serverId})`,
    );
    console.log(`Sessions to import: ${importData.sessions.length}`);

    // Pre-fetch existing users and items for the target server to avoid FK violations
    console.log("Pre-fetching existing users and items for FK validation...");

    const existingUsers = await db.query.users.findMany({
      where: eq(users.serverId, serverIdNum),
      columns: { id: true },
    });
    const existingUserIds = new Set(existingUsers.map((u) => u.id));

    const existingItems = await db.query.items.findMany({
      where: eq(items.serverId, serverIdNum),
      columns: { id: true },
    });
    const existingItemIds = new Set(existingItems.map((i) => i.id));

    console.log(
      `Found ${existingUsers.length} existing users and ${existingItems.length} existing items on target server`,
    );

    // Process and import sessions
    let processedCount = 0;
    let importedCount = 0;
    let errorCount = 0;
    let userIdNullified = 0;
    let itemIdNullified = 0;
    const batchSize = 100; // Process in batches to avoid memory issues

    for (let i = 0; i < importData.sessions.length; i += batchSize) {
      const batch = importData.sessions.slice(i, i + batchSize);
      const sessionBatch: NewSession[] = [];

      for (const importSession of batch) {
        try {
          // Validate foreign key references and nullify if they don't exist
          const validUserId =
            importSession.userId && existingUserIds.has(importSession.userId)
              ? importSession.userId
              : null;

          const validItemId =
            importSession.itemId && existingItemIds.has(importSession.itemId)
              ? importSession.itemId
              : null;

          // Track nullifications for reporting
          if (importSession.userId && !validUserId) {
            userIdNullified++;
          }
          if (importSession.itemId && !validItemId) {
            itemIdNullified++;
          }

          // Convert the import session to the database format
          const sessionData: NewSession = {
            // Keep the original ID to avoid duplicates
            id: importSession.id,

            // Use the target server ID instead of the original
            serverId: serverIdNum,

            // User and item references - use validated IDs or null
            userId: validUserId,
            itemId: validItemId,
            userName: importSession.userName,
            userServerId: importSession.userServerId, // This is not a FK, keep original

            // Device information
            deviceId: importSession.deviceId,
            deviceName: importSession.deviceName,
            clientName: importSession.clientName,
            applicationVersion: importSession.applicationVersion,
            remoteEndPoint: importSession.remoteEndPoint,

            // Media information
            itemName: importSession.itemName,
            seriesId: importSession.seriesId, // Not a FK, keep original
            seriesName: importSession.seriesName,
            seasonId: importSession.seasonId, // Not a FK, keep original

            // Playback timing
            playDuration: importSession.playDuration,
            startTime: importSession.startTime
              ? new Date(importSession.startTime)
              : null,
            endTime: importSession.endTime
              ? new Date(importSession.endTime)
              : null,
            lastActivityDate: importSession.lastActivityDate
              ? new Date(importSession.lastActivityDate)
              : null,
            lastPlaybackCheckIn: importSession.lastPlaybackCheckIn
              ? new Date(importSession.lastPlaybackCheckIn)
              : null,

            // Playback position and progress
            runtimeTicks: importSession.runtimeTicks,
            positionTicks: importSession.positionTicks,
            percentComplete: importSession.percentComplete,

            // Playback state
            completed: importSession.completed,
            isPaused: importSession.isPaused,
            isMuted: importSession.isMuted,
            isActive: importSession.isActive,

            // Audio/Video settings
            volumeLevel: importSession.volumeLevel,
            audioStreamIndex: importSession.audioStreamIndex,
            subtitleStreamIndex: importSession.subtitleStreamIndex,
            playMethod: importSession.playMethod,
            mediaSourceId: importSession.mediaSourceId,
            repeatMode: importSession.repeatMode,
            playbackOrder: importSession.playbackOrder,

            // Media stream information
            videoCodec: importSession.videoCodec,
            audioCodec: importSession.audioCodec,
            resolutionWidth: importSession.resolutionWidth,
            resolutionHeight: importSession.resolutionHeight,
            videoBitRate: importSession.videoBitRate,
            audioBitRate: importSession.audioBitRate,
            audioChannels: importSession.audioChannels,
            audioSampleRate: importSession.audioSampleRate,
            videoRangeType: importSession.videoRangeType,

            // Transcoding information
            isTranscoded: importSession.isTranscoded,
            transcodingWidth: importSession.transcodingWidth,
            transcodingHeight: importSession.transcodingHeight,
            transcodingVideoCodec: importSession.transcodingVideoCodec,
            transcodingAudioCodec: importSession.transcodingAudioCodec,
            transcodingContainer: importSession.transcodingContainer,
            transcodingIsVideoDirect: importSession.transcodingIsVideoDirect,
            transcodingIsAudioDirect: importSession.transcodingIsAudioDirect,
            transcodingBitrate: importSession.transcodingBitrate,
            transcodingCompletionPercentage:
              importSession.transcodingCompletionPercentage,
            transcodingAudioChannels: importSession.transcodingAudioChannels,
            transcodingHardwareAccelerationType:
              importSession.transcodingHardwareAccelerationType,
            transcodeReasons: importSession.transcodeReasons,

            // Raw data and timestamps
            rawData: importSession.rawData,
            createdAt: new Date(importSession.createdAt),
            updatedAt: new Date(importSession.updatedAt),
          };

          sessionBatch.push(sessionData);
          processedCount++;
        } catch (error) {
          console.error(
            `Failed to process session ${importSession.id}:`,
            error,
          );
          errorCount++;
          processedCount++;
        }
      }

      // Insert the batch
      if (sessionBatch.length > 0) {
        try {
          await db.insert(sessions).values(sessionBatch).onConflictDoNothing();
          importedCount += sessionBatch.length;
        } catch (error) {
          console.error("Failed to insert batch:", error);
          errorCount += sessionBatch.length;
        }
      }
    }

    const message = `Successfully imported ${importedCount} of ${processedCount} sessions from ${importData.server.name} to ${targetServer.name}`;

    console.log(`Import completed: ${message}`);
    if (errorCount > 0) {
      console.warn(`Import had ${errorCount} errors`);
    }
    if (userIdNullified > 0) {
      console.warn(
        `Nullified ${userIdNullified} user references (users not found on target server)`,
      );
    }
    if (itemIdNullified > 0) {
      console.warn(
        `Nullified ${itemIdNullified} item references (items not found on target server)`,
      );
    }

    return NextResponse.json({
      success: true,
      message,
      imported_count: importedCount,
      total_count: processedCount,
      error_count: errorCount,
      user_references_nullified: userIdNullified,
      item_references_nullified: itemIdNullified,
      source_server: importData.server.name,
      target_server: targetServer.name,
      export_timestamp: importData.exportInfo.timestamp,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Import failed",
        success: false,
      },
      { status: 500 },
    );
  }
}
