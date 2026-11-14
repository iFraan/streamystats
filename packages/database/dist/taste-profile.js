"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_ITEMS_FOR_TASTE_PROFILE = void 0;
exports.buildTasteProfile = buildTasteProfile;
exports.computeTasteProfile = computeTasteProfile;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("./schema");
const vector_1 = require("./vector");
/** Users with fewer than this many watched items with embeddings get no profile. */
exports.MIN_ITEMS_FOR_TASTE_PROFILE = 3;
/** Half-life for recency decay ≈ 200 days (more forgiving). */
const RECENCY_LAMBDA = 0.0035;
/** Weight applied to items the user "bounced" from. */
const BOUNCE_WEIGHT = -0.3;
/** Number of episodes to consider a series "fully engaged" for profile weighting. */
const SERIES_FULL_ENGAGEMENT_EPISODES = 5;
/** Minimum average completion per episode to avoid bounce penalty for series. */
const SERIES_BOUNCE_THRESHOLD = 0.15;
/** Minimum average completion to avoid bounce penalty for movies. */
const MOVIES_BOUNCE_THRESHOLD = 0.1;
const TICKS_PER_SECOND = 10_000_000;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
function itemWeight({ item, now, }) {
    const daysSinceWatched = (now - item.lastWatchedMs) / MS_PER_DAY;
    const recencyDecay = Math.exp(-RECENCY_LAMBDA * daysSinceWatched);
    const expectedRuntimeSeconds = item.expectedRuntime / TICKS_PER_SECOND;
    const completion = expectedRuntimeSeconds > 0 && item.episodeCount > 0
        ? item.totalPlayDuration / expectedRuntimeSeconds
        : 0;
    if (item.type === "Movie") {
        return completion < MOVIES_BOUNCE_THRESHOLD
            ? BOUNCE_WEIGHT
            : completion * recencyDecay;
    }
    if (completion < SERIES_BOUNCE_THRESHOLD)
        return BOUNCE_WEIGHT;
    const engagement = Math.min(item.episodeCount / SERIES_FULL_ENGAGEMENT_EPISODES, 1.0);
    const rewatchBoost = Math.max(completion, 1.0);
    return engagement * rewatchBoost * recencyDecay;
}
/**
 * Weighted, unit-length average of the watched items' embeddings. Items whose
 * embedding dimension differs from the first one are ignored.
 */
function buildTasteProfile({ watched, now, minItems = exports.MIN_ITEMS_FOR_TASTE_PROFILE, }) {
    if (watched.length === 0 || watched.length < minItems)
        return null;
    const dims = watched[0].embedding.length;
    const profile = new Array(dims).fill(0);
    let totalAbsWeight = 0;
    for (const item of watched) {
        if (item.embedding.length !== dims)
            continue;
        const weight = itemWeight({ item, now });
        for (let d = 0; d < dims; d++) {
            profile[d] += weight * item.embedding[d];
        }
        totalAbsWeight += Math.abs(weight);
    }
    if (totalAbsWeight === 0)
        return null;
    for (let d = 0; d < dims; d++) {
        profile[d] /= totalAbsWeight;
    }
    return { embedding: (0, vector_1.normalizeVector)(profile), itemCount: watched.length };
}
/**
 * Build a user's taste profile from their watch history on one server. With a
 * window, only sessions that started inside it count.
 */
async function computeTasteProfile({ database, serverId, userId, now, window, minItems, }) {
    const sessionConditions = [
        (0, drizzle_orm_1.eq)(schema_1.sessions.serverId, serverId),
        (0, drizzle_orm_1.eq)(schema_1.sessions.userId, userId),
        (0, drizzle_orm_1.isNotNull)(schema_1.sessions.playDuration),
        (0, drizzle_orm_1.isNotNull)(schema_1.items.embedding),
    ];
    if (window?.start)
        sessionConditions.push((0, drizzle_orm_1.gte)(schema_1.sessions.startTime, window.start));
    if (window?.end)
        sessionConditions.push((0, drizzle_orm_1.lte)(schema_1.sessions.startTime, window.end));
    // Sequential on purpose: the job passes a transaction, which runs one query at a time.
    const movieRows = await database
        .select({
        itemId: schema_1.sessions.itemId,
        embedding: schema_1.items.embedding,
        totalPlayDuration: (0, drizzle_orm_1.sql) `SUM(${schema_1.sessions.playDuration})`.as("totalPlayDuration"),
        expectedRuntime: schema_1.items.runtimeTicks,
        lastWatched: (0, drizzle_orm_1.sql) `MAX(${schema_1.sessions.endTime})`.as("lastWatched"),
    })
        .from(schema_1.sessions)
        .innerJoin(schema_1.items, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.items.id, schema_1.sessions.itemId), (0, drizzle_orm_1.eq)(schema_1.items.serverId, schema_1.sessions.serverId), (0, drizzle_orm_1.eq)(schema_1.items.type, "Movie")))
        .where((0, drizzle_orm_1.and)(...sessionConditions))
        .groupBy(schema_1.sessions.itemId, schema_1.items.serverId, schema_1.items.id);
    const seriesRows = await database
        .select({
        seriesId: schema_1.sessions.seriesId,
        embedding: schema_1.items.embedding,
        episodeCount: (0, drizzle_orm_1.sql) `COUNT(DISTINCT ${schema_1.sessions.itemId})`.as("episodeCount"),
        totalPlayDuration: (0, drizzle_orm_1.sql) `SUM(${schema_1.sessions.playDuration})`.as("totalPlayDuration"),
        avgEpisodeRuntimeTicks: (0, drizzle_orm_1.sql) `AVG(${schema_1.sessions.runtimeTicks})`.as("avgEpisodeRuntimeTicks"),
        lastWatched: (0, drizzle_orm_1.sql) `MAX(${schema_1.sessions.endTime})`.as("lastWatched"),
    })
        .from(schema_1.sessions)
        .innerJoin(schema_1.items, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.items.id, schema_1.sessions.seriesId), (0, drizzle_orm_1.eq)(schema_1.items.serverId, schema_1.sessions.serverId), (0, drizzle_orm_1.eq)(schema_1.items.type, "Series")))
        .where((0, drizzle_orm_1.and)(...sessionConditions, (0, drizzle_orm_1.isNotNull)(schema_1.sessions.seriesId)))
        .groupBy(schema_1.sessions.seriesId, schema_1.items.serverId, schema_1.items.id);
    const lastWatchedMs = (value) => value ? new Date(value).getTime() : now;
    const watched = [];
    for (const row of movieRows) {
        if (!row.embedding || !row.itemId)
            continue;
        watched.push({
            itemId: row.itemId,
            embedding: row.embedding,
            type: "Movie",
            totalPlayDuration: Number(row.totalPlayDuration ?? 0),
            expectedRuntime: row.expectedRuntime ?? 0,
            lastWatchedMs: lastWatchedMs(row.lastWatched),
            episodeCount: 1,
        });
    }
    for (const row of seriesRows) {
        if (!row.embedding || !row.seriesId)
            continue;
        const episodeCount = Number(row.episodeCount ?? 1);
        watched.push({
            itemId: row.seriesId,
            embedding: row.embedding,
            type: "Series",
            totalPlayDuration: Number(row.totalPlayDuration ?? 0),
            expectedRuntime: Number(row.avgEpisodeRuntimeTicks ?? 0) * episodeCount,
            lastWatchedMs: lastWatchedMs(row.lastWatched),
            episodeCount,
        });
    }
    return buildTasteProfile({ watched, now, minItems });
}
//# sourceMappingURL=taste-profile.js.map