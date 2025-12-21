import { db, servers } from "@streamystats/database";
import { eq } from "drizzle-orm";
import { publishJobEvent, nowIsoMicroUtc } from "../events/job-events";
import { syncRecentActivities } from "../jellyfin/sync";
import { geolocateActivitiesJob } from "./geolocation-jobs";
import { calculateFingerprintsJob } from "./geolocation-jobs";

export const SECURITY_SYNC_JOB_NAME = "security-full-sync";

interface SecuritySyncResult {
  activitiesSynced: number;
  locationsProcessed: number;
  fingerprintsUpdated: number;
  anomaliesDetected: number;
}

/**
 * Combined security sync job that runs:
 * 1. Activity sync from Jellyfin
 * 2. Geolocation processing
 * 3. Fingerprint calculation
 *
 * Publishes SSE events for each step and overall progress.
 */
export async function securityFullSyncJob(job: {
  data: { serverId: number };
}): Promise<SecuritySyncResult> {
  const { serverId } = job.data;
  const startTime = Date.now();

  const result: SecuritySyncResult = {
    activitiesSynced: 0,
    locationsProcessed: 0,
    fingerprintsUpdated: 0,
    anomaliesDetected: 0,
  };

  // Get server
  const serverData = await db
    .select()
    .from(servers)
    .where(eq(servers.id, serverId))
    .limit(1);

  if (!serverData.length) {
    publishJobEvent({
      type: "failed",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      error: "Server not found",
      timestamp: nowIsoMicroUtc(),
    });
    throw new Error(`Server not found: ${serverId}`);
  }

  const server = serverData[0];

  // Publish started event
  publishJobEvent({
    type: "started",
    jobName: SECURITY_SYNC_JOB_NAME,
    serverId,
    timestamp: nowIsoMicroUtc(),
    data: { step: "starting" },
  });

  try {
    // Step 1: Activity Sync
    publishJobEvent({
      type: "progress",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      timestamp: nowIsoMicroUtc(),
      data: { step: "activities", message: "Syncing activities..." },
    });

    const activityResult = await syncRecentActivities(server, {
      pageSize: 100,
      maxPages: 5,
      intelligent: true,
    });

    if (activityResult.status === "error") {
      throw new Error(activityResult.error);
    }

    // "Synced" = number of changed rows (inserted + updated)
    result.activitiesSynced =
      activityResult.data.activitiesInserted +
      activityResult.data.activitiesUpdated;

    // Step 2: Geolocation
    publishJobEvent({
      type: "progress",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      timestamp: nowIsoMicroUtc(),
      data: {
        step: "geolocation",
        message: "Processing locations...",
        activitiesSynced: result.activitiesSynced,
      },
    });

    // Run geolocation in batches until done
    let totalProcessed = 0;
    let hasMore = true;
    const batchSize = 500;

    while (hasMore && totalProcessed < 10000) {
      const geoResult = await geolocateActivitiesJob({
        data: { serverId, batchSize },
      });

      totalProcessed += geoResult.processed;
      result.anomaliesDetected += geoResult.anomalies;

      if (geoResult.processed < batchSize) {
        hasMore = false;
      }

      // Progress update every batch
      if (hasMore) {
        publishJobEvent({
          type: "progress",
          jobName: SECURITY_SYNC_JOB_NAME,
          serverId,
          timestamp: nowIsoMicroUtc(),
          data: {
            step: "geolocation",
            message: `Processed ${totalProcessed} locations...`,
            locationsProcessed: totalProcessed,
          },
        });
      }
    }

    result.locationsProcessed = totalProcessed;

    // Step 3: Fingerprints
    publishJobEvent({
      type: "progress",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      timestamp: nowIsoMicroUtc(),
      data: {
        step: "fingerprints",
        message: "Calculating fingerprints...",
        locationsProcessed: result.locationsProcessed,
      },
    });

    const fingerprintResult = await calculateFingerprintsJob({
      data: { serverId },
    });

    result.fingerprintsUpdated = fingerprintResult.usersProcessed;

    // Complete!
    const duration = Date.now() - startTime;

    publishJobEvent({
      type: "completed",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      timestamp: nowIsoMicroUtc(),
      data: {
        ...result,
        durationMs: duration,
      },
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    publishJobEvent({
      type: "failed",
      jobName: SECURITY_SYNC_JOB_NAME,
      serverId,
      timestamp: nowIsoMicroUtc(),
      error: errorMessage,
    });

    console.error(`[security-sync] serverId=${serverId} action=error`, error);
    throw error;
  }
}



