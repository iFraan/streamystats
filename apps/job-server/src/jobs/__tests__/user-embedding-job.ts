import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  closeConnection,
  db,
  items,
  libraries,
  servers,
  sessions,
  userEmbeddings,
  users,
} from "@streamystats/database";
import { eq, inArray } from "drizzle-orm";
import { migrateTestDatabase } from "../../../../../packages/database/tests/setup";
import {
  calculateUserEmbeddingsJob,
  USER_EMBEDDING_JOB_NAME,
} from "../user-embedding-job";

const url = process.env.DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) {
  throw new Error("Use an isolated database ending in _test");
}
await migrateTestDatabase(url);
const fixtures = await db
  .insert(servers)
  .values(
    ["A", "B"].map((name) => ({
      name: "Taste profile " + name,
      url: "http://" + randomUUID() + ".invalid",
      apiKey: "fixture",
      embeddingDimensions: 3,
    })),
  )
  .returning();
const libraryId = randomUUID();
const movies = Array.from({ length: 3 }, () => randomUUID());
const series = Array.from({ length: 3 }, () => ({
  id: randomUUID(),
  episodeId: randomUUID(),
}));
const runtimeTicks = 3600 * 10_000_000;
try {
  for (const [serverIndex, server] of fixtures.entries()) {
    const userId = randomUUID();
    const now = new Date();
    await db
      .insert(users)
      .values({
        id: userId,
        serverId: server.id,
        name: "Viewer",
        lastActivityDate: now,
      });
    await db
      .insert(libraries)
      .values({
        id: libraryId,
        serverId: server.id,
        name: "Media",
        type: "Mixed",
      });
    const embedding = serverIndex === 0 ? [1, 0, 0] : [0, 1, 0];
    await db
      .insert(items)
      .values(
        [
          ...movies.map((id) => ({
            id,
            name: "Movie",
            type: "Movie",
            isFolder: false,
          })),
          ...series.map(({ id }) => ({
            id,
            name: "Series",
            type: "Series",
            isFolder: true,
          })),
          ...series.map(({ id, episodeId }) => ({
            id: episodeId,
            name: "Episode",
            type: "Episode",
            isFolder: false,
            seriesId: id,
          })),
        ].map((item) => ({
          ...item,
          serverId: server.id,
          libraryId,
          embedding,
          runtimeTicks,
          rawData: {},
        })),
      );
    await db.insert(sessions).values(
      [
        ...movies.map((itemId) => ({ itemId, seriesId: null })),
        ...series.map(({ id, episodeId }) => ({
          itemId: episodeId,
          seriesId: id,
        })),
      ].map((item) => ({
        ...item,
        id: randomUUID(),
        serverId: server.id,
        userId,
        userServerId: userId,
        userName: "Viewer",
        playDuration: runtimeTicks,
        runtimeTicks,
        startTime: new Date(now.getTime() - 3_600_000),
        endTime: now,
        completed: true,
        isPaused: false,
        isActive: false,
        isMuted: false,
        rawData: {},
      })),
    );
    const result = await calculateUserEmbeddingsJob({
      id: randomUUID(),
      name: USER_EMBEDDING_JOB_NAME,
      data: { serverId: server.id },
      expireInSeconds: 60,
      heartbeatSeconds: null,
      signal: new AbortController().signal,
    });
    assert.equal(result.usersProcessed, 1);
    assert.equal(result.usersSkipped, 0);
    const [profile] = await db
      .select()
      .from(userEmbeddings)
      .where(eq(userEmbeddings.serverId, server.id));
    assert.ok(profile);
    assert.equal(profile.itemCount, 6);
    for (const [dimension, expected] of embedding.entries()) {
      assert.ok(Math.abs(profile.embedding[dimension] - expected) < 0.000001);
    }
  }
  console.log("taste profile regressions passed");
} finally {
  await db.delete(servers).where(
    inArray(
      servers.id,
      fixtures.map((server) => server.id),
    ),
  );
  await closeConnection();
}
