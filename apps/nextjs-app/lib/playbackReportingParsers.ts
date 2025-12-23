// =============================================================================
// Playback Reporting Parsers - Pure functions for parsing TSV/JSON data
// =============================================================================

// =============================================================================
// Constants
// =============================================================================

export const INT32_MIN = -2147483648;
export const HEX32 = /^[0-9a-f]{32}$/i;

// =============================================================================
// Types
// =============================================================================

export type ItemType = "Movie" | "Episode" | (string & {});
export type PlayMode = "DirectPlay" | "DirectStream" | "Transcode" | "Other";
export type PositionKind = "seconds" | "milliseconds" | "invalid";

export interface PlayMethodParsed {
  mode: PlayMode;
  video?: string;
  audio?: string;
}

export interface PlaybackRow {
  timestampRaw: string;
  timestampMs?: number;
  userId: string;
  itemId: string;
  itemType: ItemType;
  itemName: string;
  itemNameRaw: string;
  playMethodRaw: string;
  play: PlayMethodParsed;
  client: string;
  deviceName: string;
  positionSeconds?: number;
  positionSecondsRaw: number;
  positionKind: PositionKind;
}

export interface EpisodeInfo {
  seriesName: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
}

// =============================================================================
// Pure Parsing Functions
// =============================================================================

/**
 * Parse .NET-style timestamp with variable fractional precision (0-7 digits).
 * Format: "YYYY-MM-DD HH:mm:ss.fffffff"
 * Returns milliseconds since epoch or undefined if invalid.
 */
export function parseDotNetTimestamp(raw: string): number | undefined {
  const s = raw.trim();
  const spaceIdx = s.indexOf(" ");
  if (spaceIdx < 0) return undefined;

  const datePart = s.slice(0, spaceIdx);
  const timePart = s.slice(spaceIdx + 1);

  const dateParts = datePart.split("-");
  if (dateParts.length !== 3) return undefined;

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);

  const [timeOnly, frac] = timePart.split(".");
  const timeParts = timeOnly.split(":");
  if (timeParts.length !== 3) return undefined;

  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1]);
  const seconds = Number(timeParts[2]);

  // Convert fractional part to milliseconds (pad/truncate to 3 digits)
  const fracStr = (frac ?? "").trim();
  const msStr = `${fracStr}000`.slice(0, 3);
  const ms = Number(msStr);

  const dt = new Date(year, month - 1, day, hours, minutes, seconds, ms);
  const result = dt.getTime();
  return Number.isFinite(result) ? result : undefined;
}

/**
 * Parse play method string into structured object.
 * Handles: "DirectPlay", "DirectStream", "Transcode (v:h264 a:eac3)", "Transcode (v:direct a:aac)"
 */
export function parsePlayMethod(raw: string): PlayMethodParsed {
  const s = raw.trim();

  if (s === "DirectPlay") {
    return { mode: "DirectPlay" };
  }

  if (s === "DirectStream") {
    return { mode: "DirectStream" };
  }

  if (s.startsWith("Transcode")) {
    const openParen = s.indexOf("(");
    const closeParen = s.lastIndexOf(")");

    if (openParen >= 0 && closeParen > openParen) {
      const inner = s.slice(openParen + 1, closeParen);
      const parts = inner.split(" ");

      let video: string | undefined;
      let audio: string | undefined;

      for (const part of parts) {
        if (part.startsWith("v:")) {
          video = part.slice(2);
        } else if (part.startsWith("a:")) {
          audio = part.slice(2);
        }
      }

      return { mode: "Transcode", video, audio };
    }

    return { mode: "Transcode" };
  }

  return { mode: "Other" };
}

/**
 * Normalize position value with heuristic for ms vs seconds detection.
 * INT32_MIN (-2147483648) is treated as invalid sentinel.
 * Values >= 86400 (24h) are assumed to be milliseconds if resulting seconds < 6h.
 */
export function normalizePosition(rawNum: number): {
  positionSeconds?: number;
  positionKind: PositionKind;
} {
  if (!Number.isFinite(rawNum) || rawNum === INT32_MIN) {
    return { positionKind: "invalid" };
  }

  // Values >= 24h in seconds likely mean milliseconds
  if (rawNum >= 86400) {
    const asSeconds = rawNum / 1000;
    // Only accept if result is plausible (< 6 hours)
    if (asSeconds > 0 && asSeconds < 21600) {
      return { positionSeconds: asSeconds, positionKind: "milliseconds" };
    }
    return { positionKind: "invalid" };
  }

  return { positionSeconds: rawNum, positionKind: "seconds" };
}

/**
 * Parse episode info from item name.
 * Handles patterns like: "Series Name - s01e05 - Episode Title"
 */
export function parseEpisodeInfo(itemName: string): EpisodeInfo {
  const result: EpisodeInfo = {
    seriesName: null,
    seasonNumber: null,
    episodeNumber: null,
  };

  // Match pattern: "Series Name - sXXeYY" or "Series Name - sXXeYY - Episode Title"
  const match = itemName.match(/^(.+?)\s*-\s*s(\d+)e(\d+)/i);

  if (match) {
    result.seriesName = match[1].trim();
    result.seasonNumber = Number.parseInt(match[2], 10);
    result.episodeNumber = Number.parseInt(match[3], 10);
  }

  return result;
}

/**
 * Parse a single TSV line using end-to-front strategy.
 * This is robust against itemName containing tabs.
 *
 * Expected format (9 columns):
 * timestamp | userId | itemId | itemType | itemName | playMethod | client | deviceName | position
 */
export function parseTsvLine(line: string): PlaybackRow | null {
  const trimmed = line.trimEnd();
  if (!trimmed) return null;

  const parts = trimmed.split("\t");
  if (parts.length < 9) return null;

  // Parse from the end (robust if itemName contains tabs)
  const positionStr = parts[parts.length - 1]!.trim();
  const deviceName = parts[parts.length - 2]!.trim();
  const client = parts[parts.length - 3]!.trim();
  const playMethodRaw = parts[parts.length - 4]!.trim();

  // Fixed fields from the start
  const timestampRaw = parts[0]!.trim();
  const userId = parts[1]!.trim();
  const itemId = parts[2]!.trim();
  const itemType = parts[3]!.trim() as ItemType;

  // Middle becomes itemName (handles tabs in title)
  const nameParts: string[] = [];
  for (let i = 4; i <= parts.length - 5; i++) {
    nameParts.push(parts[i]!);
  }
  const itemNameRaw = nameParts.join("\t");
  const itemName = itemNameRaw.trim();

  // Parse position
  const positionSecondsRaw = Number(positionStr);
  const { positionSeconds, positionKind } = normalizePosition(
    Number.isFinite(positionSecondsRaw) ? positionSecondsRaw : INT32_MIN,
  );

  return {
    timestampRaw,
    timestampMs: parseDotNetTimestamp(timestampRaw),
    userId,
    itemId,
    itemType,
    itemName,
    itemNameRaw,
    playMethodRaw,
    play: parsePlayMethod(playMethodRaw),
    client,
    deviceName,
    positionSeconds,
    positionSecondsRaw: Number.isFinite(positionSecondsRaw)
      ? positionSecondsRaw
      : 0,
    positionKind,
  };
}

/**
 * Validate hex32 format for userId/itemId
 */
export function isValidHex32(value: string): boolean {
  return HEX32.test(value);
}
