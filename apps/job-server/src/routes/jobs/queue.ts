import { Hono } from "hono";
import { getJobQueue, JobTypes } from "../../jobs/queue";
import { JELLYFIN_JOB_NAMES } from "../../jellyfin/workers";
import { db, jobResults } from "@streamystats/database";
import { eq, desc } from "drizzle-orm";
import { cancelJobsByName } from "./utils";

const app = new Hono();

app.post("/cancel-by-type", async (c) => {
  try {
    const { jobType, serverId } = await c.req.json();

    if (!jobType) {
      return c.json({ error: "Job type is required" }, 400);
    }

    const validJobTypes = [
      JobTypes.SYNC_SERVER_DATA,
      JobTypes.ADD_SERVER,
      JobTypes.GENERATE_ITEM_EMBEDDINGS,
      ...Object.values(JELLYFIN_JOB_NAMES),
    ];

    if (!validJobTypes.includes(jobType)) {
      return c.json(
        { error: "Invalid job type", validTypes: validJobTypes },
        400
      );
    }

    const cancelledCount = await cancelJobsByName(jobType, serverId);

    return c.json({
      success: true,
      message: `Jobs of type "${jobType}" cancelled successfully. ${cancelledCount} jobs cancelled.`,
      cancelledCount,
      jobType,
      serverId: serverId || null,
    });
  } catch (error) {
    console.error("Error cancelling jobs by type:", error);
    return c.json(
      {
        error: "Failed to cancel jobs",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

app.get("/queue/:queueName/:jobId/status", async (c) => {
  try {
    const queueName = c.req.param("queueName");
    const jobId = c.req.param("jobId");

    const boss = await getJobQueue();
    const job = await boss.getJobById(queueName, jobId);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        state: job.state,
        data: job.data,
        output: job.output,
        createdOn: job.createdOn,
        startedOn: job.startedOn,
        completedOn: job.completedOn,
      },
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return c.json({ error: "Failed to fetch job status" }, 500);
  }
});

app.get("/results", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const status = c.req.query("status");
    const jobName = c.req.query("jobName");

    if (status) {
      const results = await db
        .select()
        .from(jobResults)
        .where(eq(jobResults.status, status))
        .orderBy(desc(jobResults.createdAt))
        .limit(limit);

      return c.json({ success: true, results, count: results.length });
    }

    if (jobName) {
      const results = await db
        .select()
        .from(jobResults)
        .where(eq(jobResults.jobName, jobName))
        .orderBy(desc(jobResults.createdAt))
        .limit(limit);

      return c.json({ success: true, results, count: results.length });
    }

    const results = await db
      .select()
      .from(jobResults)
      .orderBy(desc(jobResults.createdAt))
      .limit(limit);

    return c.json({ success: true, results, count: results.length });
  } catch (error) {
    console.error("Error fetching job results:", error);
    return c.json({ error: "Failed to fetch job results" }, 500);
  }
});

app.get("/queue/stats", async (c) => {
  try {
    const boss = await getJobQueue();

    const stats = await Promise.all([
      boss.getQueueStats(JobTypes.SYNC_SERVER_DATA),
      boss.getQueueStats(JobTypes.ADD_SERVER),
      boss.getQueueStats(JobTypes.GENERATE_ITEM_EMBEDDINGS),
    ]);

    const queuedCounts = stats.map((s) => s.queuedCount);

    return c.json({
      success: true,
      queueStats: {
        syncServerData: queuedCounts[0],
        addServer: queuedCounts[1],
        generateItemEmbeddings: queuedCounts[2],
        total: queuedCounts.reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    return c.json({ error: "Failed to fetch queue stats" }, 500);
  }
});

export default app;
