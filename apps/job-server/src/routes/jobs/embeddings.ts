import { Hono } from "hono";
import { getJobQueue } from "../../jobs/queue";
import { db, servers } from "@streamystats/database";
import { eq } from "drizzle-orm";
import {
  clearEmbeddingIndexCache,
  clearStopFlag,
  setStopFlag,
} from "../../jobs/embedding-jobs";
import { cancelJobsByName } from "./utils";

const app = new Hono();

app.post("/start-embedding", async (c) => {
  try {
    const { serverId } = await c.req.json();

    if (!serverId) {
      return c.json({ error: "Server ID is required" }, 400);
    }

    const server = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server.length) {
      return c.json({ error: "Server not found" }, 404);
    }

    const serverConfig = server[0];

    if (!serverConfig.embeddingProvider) {
      return c.json(
        {
          error:
            "Embedding provider not configured. Please configure it in server settings.",
        },
        400
      );
    }

    if (!serverConfig.embeddingBaseUrl || !serverConfig.embeddingModel) {
      return c.json(
        {
          error:
            "Embedding configuration incomplete. Please set base URL and model.",
        },
        400
      );
    }

    // Clear the stop flag before starting
    await clearStopFlag(serverId);

    const boss = await getJobQueue();
    const jobId = await boss.send("generate-item-embeddings", {
      serverId,
      provider: serverConfig.embeddingProvider,
      config: {
        baseUrl: serverConfig.embeddingBaseUrl,
        apiKey: serverConfig.embeddingApiKey,
        model: serverConfig.embeddingModel,
        dimensions: serverConfig.embeddingDimensions || 1536,
      },
      manualStart: true,
    });

    return c.json({
      success: true,
      jobId,
      message: "Embedding generation job started successfully",
    });
  } catch (error) {
    console.error("Error starting embedding job:", error);
    return c.json({ error: "Failed to start embedding job" }, 500);
  }
});

app.post("/stop-embedding", async (c) => {
  try {
    const { serverId } = await c.req.json();

    if (!serverId) {
      return c.json({ error: "Server ID is required" }, 400);
    }

    // Set stop flag - the running job will check this and stop
    await setStopFlag(serverId);

    // Also cancel any queued jobs that haven't started yet
    const cancelledCount = await cancelJobsByName(
      "generate-item-embeddings",
      serverId
    );

    return c.json({
      success: true,
      message: `Stop flag set. ${cancelledCount} queued jobs cancelled.`,
      cancelledCount,
    });
  } catch (error) {
    console.error("Error stopping embedding job:", error);
    return c.json(
      {
        error: "Failed to stop embedding job",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

app.post("/clear-embedding-cache", async (c) => {
  try {
    clearEmbeddingIndexCache();
    return c.json({
      success: true,
      message: "Embedding index cache cleared",
    });
  } catch (error) {
    console.error("Error clearing embedding cache:", error);
    return c.json(
      {
        error: "Failed to clear embedding cache",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
