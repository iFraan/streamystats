import type { db } from "./connection";
/** Users with fewer than this many watched items with embeddings get no profile. */
export declare const MIN_ITEMS_FOR_TASTE_PROFILE = 3;
export interface TasteProfileWatchedItem {
    itemId: string;
    embedding: number[];
    type: "Movie" | "Series";
    /** Seconds played across every session of the movie or the series' episodes. */
    totalPlayDuration: number;
    /** Expected runtime in ticks; for a series, the average episode runtime times the episodes watched. */
    expectedRuntime: number;
    lastWatchedMs: number;
    /** 1 for movies, distinct episodes watched for series. */
    episodeCount: number;
}
export interface TasteProfile {
    embedding: number[];
    itemCount: number;
}
export interface TasteProfileWindow {
    start?: Date;
    end?: Date;
}
/**
 * Weighted, unit-length average of the watched items' embeddings. Items whose
 * embedding dimension differs from the first one are ignored.
 */
export declare function buildTasteProfile({ watched, now, minItems, }: {
    watched: TasteProfileWatchedItem[];
    now: number;
    minItems?: number;
}): TasteProfile | null;
/**
 * Build a user's taste profile from their watch history on one server. With a
 * window, only sessions that started inside it count.
 */
export declare function computeTasteProfile({ database, serverId, userId, now, window, minItems, }: {
    database: Pick<typeof db, "select">;
    serverId: number;
    userId: string;
    now: number;
    window?: TasteProfileWindow;
    minItems?: number;
}): Promise<TasteProfile | null>;
//# sourceMappingURL=taste-profile.d.ts.map