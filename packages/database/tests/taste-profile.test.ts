import { describe, expect, test } from "bun:test";
import {
  buildTasteProfile,
  type TasteProfileWatchedItem,
} from "../src/taste-profile";

const now = Date.UTC(2026, 10, 14);
const hourTicks = 3600 * 10_000_000;

function movie(
  embedding: number[],
  overrides: Partial<TasteProfileWatchedItem> = {},
): TasteProfileWatchedItem {
  return {
    itemId: crypto.randomUUID(),
    embedding,
    type: "Movie",
    totalPlayDuration: 3600,
    expectedRuntime: hourTicks,
    lastWatchedMs: now,
    episodeCount: 1,
    ...overrides,
  };
}

describe("buildTasteProfile", () => {
  test("needs the minimum number of watched items", () => {
    const watched = [movie([1, 0]), movie([1, 0])];
    expect(buildTasteProfile({ watched, now })).toBeNull();
    expect(buildTasteProfile({ watched, now, minItems: 2 })).not.toBeNull();
    expect(buildTasteProfile({ watched: [], now, minItems: 0 })).toBeNull();
  });

  test("returns a unit-length profile pointing at the watched taste", () => {
    const profile = buildTasteProfile({
      watched: [movie([1, 0]), movie([1, 0]), movie([0, 1])],
      now,
    });
    expect(profile?.itemCount).toBe(3);
    const [x, y] = profile?.embedding ?? [];
    expect(Math.hypot(x, y)).toBeCloseTo(1, 6);
    expect(x).toBeGreaterThan(y);
  });

  test("pushes away from movies the user bounced from", () => {
    const profile = buildTasteProfile({
      watched: [
        movie([1, 0]),
        movie([0, 1], { totalPlayDuration: 60 }),
        movie([1, 0]),
      ],
      now,
    });
    expect(profile?.embedding[1]).toBeLessThan(0);
  });

  test("weights recent watches above old ones", () => {
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const profile = buildTasteProfile({
      watched: [movie([1, 0]), movie([0, 1], { lastWatchedMs: yearAgo })],
      now,
      minItems: 1,
    });
    const [x, y] = profile?.embedding ?? [];
    expect(x).toBeGreaterThan(y);
    expect(y).toBeGreaterThan(0);
  });

  test("weights series by engaged episodes", () => {
    const series = (episodeCount: number, embedding: number[]) => ({
      ...movie(embedding),
      type: "Series" as const,
      episodeCount,
      expectedRuntime: hourTicks * episodeCount,
      totalPlayDuration: 3600 * episodeCount,
    });
    const profile = buildTasteProfile({
      watched: [series(5, [1, 0]), series(1, [0, 1])],
      now,
      minItems: 1,
    });
    const [x, y] = profile?.embedding ?? [];
    expect(x / y).toBeCloseTo(5, 6);
  });

  test("ignores embeddings with a different dimension", () => {
    const profile = buildTasteProfile({
      watched: [movie([1, 0]), movie([0, 1, 0])],
      now,
      minItems: 1,
    });
    expect(profile?.embedding).toEqual([1, 0]);
  });
});
