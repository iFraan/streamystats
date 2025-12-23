import { describe, expect, test } from "bun:test";
import {
  isValidHex32,
  normalizePosition,
  parseDotNetTimestamp,
  parseEpisodeInfo,
  parsePlayMethod,
  parseTsvLine,
} from "./playbackReportingParsers";

// =============================================================================
// parseDotNetTimestamp Tests
// =============================================================================

describe("parseDotNetTimestamp", () => {
  test("parses timestamp with 7 fractional digits", () => {
    const result = parseDotNetTimestamp("2024-12-10 16:08:30.6262924");
    expect(result).toBeDefined();
    const date = new Date(result!);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(11); // 0-indexed
    expect(date.getDate()).toBe(10);
    expect(date.getHours()).toBe(16);
    expect(date.getMinutes()).toBe(8);
    expect(date.getSeconds()).toBe(30);
    expect(date.getMilliseconds()).toBe(626);
  });

  test("parses timestamp with 6 fractional digits", () => {
    const result = parseDotNetTimestamp("2025-01-07 13:21:03.835454");
    expect(result).toBeDefined();
    const date = new Date(result!);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(7);
    expect(date.getMilliseconds()).toBe(835);
  });

  test("parses timestamp without fractional part", () => {
    const result = parseDotNetTimestamp("2024-12-10 16:08:30");
    expect(result).toBeDefined();
    const date = new Date(result!);
    expect(date.getSeconds()).toBe(30);
    expect(date.getMilliseconds()).toBe(0);
  });

  test("parses timestamp with 1 fractional digit", () => {
    const result = parseDotNetTimestamp("2024-12-10 16:08:30.5");
    expect(result).toBeDefined();
    const date = new Date(result!);
    expect(date.getMilliseconds()).toBe(500);
  });

  test("parses timestamp with 2 fractional digits", () => {
    const result = parseDotNetTimestamp("2024-12-10 16:08:30.55");
    expect(result).toBeDefined();
    const date = new Date(result!);
    expect(date.getMilliseconds()).toBe(550);
  });

  test("handles leading/trailing whitespace", () => {
    const result = parseDotNetTimestamp("  2024-12-10 16:08:30.626  ");
    expect(result).toBeDefined();
  });

  test("returns undefined for invalid format - missing space", () => {
    const result = parseDotNetTimestamp("2024-12-10T16:08:30");
    expect(result).toBeUndefined();
  });

  test("returns undefined for invalid format - wrong date parts", () => {
    const result = parseDotNetTimestamp("2024-12 16:08:30");
    expect(result).toBeUndefined();
  });

  test("returns undefined for invalid format - wrong time parts", () => {
    const result = parseDotNetTimestamp("2024-12-10 16:08");
    expect(result).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    const result = parseDotNetTimestamp("");
    expect(result).toBeUndefined();
  });
});

// =============================================================================
// parsePlayMethod Tests
// =============================================================================

describe("parsePlayMethod", () => {
  test("parses DirectPlay", () => {
    const result = parsePlayMethod("DirectPlay");
    expect(result).toEqual({ mode: "DirectPlay" });
  });

  test("parses Transcode with h264 video and eac3 audio", () => {
    const result = parsePlayMethod("Transcode (v:h264 a:eac3)");
    expect(result).toEqual({
      mode: "Transcode",
      video: "h264",
      audio: "eac3",
    });
  });

  test("parses Transcode with direct video and aac audio", () => {
    const result = parsePlayMethod("Transcode (v:direct a:aac)");
    expect(result).toEqual({
      mode: "Transcode",
      video: "direct",
      audio: "aac",
    });
  });

  test("parses Transcode with both direct", () => {
    const result = parsePlayMethod("Transcode (v:direct a:direct)");
    expect(result).toEqual({
      mode: "Transcode",
      video: "direct",
      audio: "direct",
    });
  });

  test("parses Transcode without codec info", () => {
    const result = parsePlayMethod("Transcode");
    expect(result).toEqual({ mode: "Transcode" });
  });

  test("parses Transcode with malformed parentheses", () => {
    const result = parsePlayMethod("Transcode (v:h264");
    expect(result).toEqual({ mode: "Transcode" });
  });

  test("returns Other for unknown method", () => {
    const result = parsePlayMethod("SomeOtherMethod");
    expect(result).toEqual({ mode: "Other" });
  });

  test("handles whitespace", () => {
    const result = parsePlayMethod("  DirectPlay  ");
    expect(result).toEqual({ mode: "DirectPlay" });
  });

  test("handles empty string", () => {
    const result = parsePlayMethod("");
    expect(result).toEqual({ mode: "Other" });
  });

  test("parses Transcode with hevc video", () => {
    const result = parsePlayMethod("Transcode (v:hevc a:opus)");
    expect(result).toEqual({
      mode: "Transcode",
      video: "hevc",
      audio: "opus",
    });
  });

  test("parses DirectStream", () => {
    const result = parsePlayMethod("DirectStream");
    expect(result).toEqual({ mode: "DirectStream" });
  });
});

// =============================================================================
// normalizePosition Tests
// =============================================================================

describe("normalizePosition", () => {
  test("handles normal seconds value", () => {
    const result = normalizePosition(47);
    expect(result).toEqual({ positionSeconds: 47, positionKind: "seconds" });
  });

  test("handles larger seconds value (~43 min)", () => {
    const result = normalizePosition(2590);
    expect(result).toEqual({ positionSeconds: 2590, positionKind: "seconds" });
  });

  test("handles zero", () => {
    const result = normalizePosition(0);
    expect(result).toEqual({ positionSeconds: 0, positionKind: "seconds" });
  });

  test("treats INT32_MIN as invalid", () => {
    const result = normalizePosition(-2147483648);
    expect(result).toEqual({ positionKind: "invalid" });
  });

  test("treats NaN as invalid", () => {
    const result = normalizePosition(NaN);
    expect(result).toEqual({ positionKind: "invalid" });
  });

  test("treats Infinity as invalid", () => {
    const result = normalizePosition(Infinity);
    expect(result).toEqual({ positionKind: "invalid" });
  });

  test("converts milliseconds to seconds when >= 86400 and < 6h result", () => {
    // 74076 ms = 74.076 seconds, which is plausible
    const result = normalizePosition(74076);
    expect(result.positionKind).toBe("seconds");
    expect(result.positionSeconds).toBe(74076);
  });

  test("converts large milliseconds value to seconds", () => {
    // 300000 ms = 300 seconds = 5 minutes, plausible after conversion
    const result = normalizePosition(300000);
    expect(result.positionKind).toBe("milliseconds");
    expect(result.positionSeconds).toBe(300);
  });

  test("marks absurdly large values as invalid", () => {
    // 100000000 ms = 100000 seconds = ~27 hours, too long
    const result = normalizePosition(100000000);
    expect(result.positionKind).toBe("invalid");
  });

  test("handles value just below 24h threshold", () => {
    const result = normalizePosition(86399);
    expect(result).toEqual({
      positionSeconds: 86399,
      positionKind: "seconds",
    });
  });

  test("handles value at 24h threshold", () => {
    // 86400 seconds = 24 hours, treated as potential ms
    // 86400 / 1000 = 86.4 seconds, plausible
    const result = normalizePosition(86400);
    expect(result.positionKind).toBe("milliseconds");
    expect(result.positionSeconds).toBe(86.4);
  });
});

// =============================================================================
// parseEpisodeInfo Tests
// =============================================================================

describe("parseEpisodeInfo", () => {
  test("parses standard episode format", () => {
    const result = parseEpisodeInfo(
      "Person of Interest - s05e08 - Reassortment",
    );
    expect(result).toEqual({
      seriesName: "Person of Interest",
      seasonNumber: 5,
      episodeNumber: 8,
    });
  });

  test("parses episode with special characters in series name", () => {
    const result = parseEpisodeInfo("Carnivàle - s01e01 - Milfay");
    expect(result).toEqual({
      seriesName: "Carnivàle",
      seasonNumber: 1,
      episodeNumber: 1,
    });
  });

  test("parses season 00 specials", () => {
    const result = parseEpisodeInfo(
      "Gardeners' World - s00e41 - Winter Specials 2024/25 - Episode 3",
    );
    expect(result).toEqual({
      seriesName: "Gardeners' World",
      seasonNumber: 0,
      episodeNumber: 41,
    });
  });

  test("parses episode with colon in title", () => {
    const result = parseEpisodeInfo("Once Upon a Time - s01e10 - 7:15 A.M.");
    expect(result).toEqual({
      seriesName: "Once Upon a Time",
      seasonNumber: 1,
      episodeNumber: 10,
    });
  });

  test("parses episode with uppercase S and E", () => {
    const result = parseEpisodeInfo("Silo - S01E04 - Truth");
    expect(result).toEqual({
      seriesName: "Silo",
      seasonNumber: 1,
      episodeNumber: 4,
    });
  });

  test("parses double-digit season and episode", () => {
    const result = parseEpisodeInfo("Some Show - s12e99 - Title");
    expect(result).toEqual({
      seriesName: "Some Show",
      seasonNumber: 12,
      episodeNumber: 99,
    });
  });

  test("returns nulls for movie title (no sXXeYY pattern)", () => {
    const result = parseEpisodeInfo("The Best Christmas Pageant Ever");
    expect(result).toEqual({
      seriesName: null,
      seasonNumber: null,
      episodeNumber: null,
    });
  });

  test("returns nulls for empty string", () => {
    const result = parseEpisodeInfo("");
    expect(result).toEqual({
      seriesName: null,
      seasonNumber: null,
      episodeNumber: null,
    });
  });

  test("handles series name with hyphen", () => {
    const result = parseEpisodeInfo(
      "The Day of the Jackal - s01e09 - Episode 9",
    );
    expect(result).toEqual({
      seriesName: "The Day of the Jackal",
      seasonNumber: 1,
      episodeNumber: 9,
    });
  });

  test("parses high season number (s33)", () => {
    const result = parseEpisodeInfo(
      "The Graham Norton Show - s33e12 - Episode 12",
    );
    expect(result).toEqual({
      seriesName: "The Graham Norton Show",
      seasonNumber: 33,
      episodeNumber: 12,
    });
  });

  test("parses season 00 special with parenthetical part number", () => {
    const result = parseEpisodeInfo(
      "Only Fools and Horses - s00e11 - Miami Twice: The American Dream (1)",
    );
    expect(result).toEqual({
      seriesName: "Only Fools and Horses",
      seasonNumber: 0,
      episodeNumber: 11,
    });
  });

  test("parses episode with generic Episode N title", () => {
    const result = parseEpisodeInfo("Babylon Berlin - s03e02 - Episode 18");
    expect(result).toEqual({
      seriesName: "Babylon Berlin",
      seasonNumber: 3,
      episodeNumber: 2,
    });
  });

  test("parses episode with long title", () => {
    const result = parseEpisodeInfo(
      "Emily in Paris - s05e06 - The One Where Emily Goes to the Embassy",
    );
    expect(result).toEqual({
      seriesName: "Emily in Paris",
      seasonNumber: 5,
      episodeNumber: 6,
    });
  });

  test("parses episode with French accent in title", () => {
    const result = parseEpisodeInfo(
      "Emily in Paris - s05e09 - La Belle Époque",
    );
    expect(result).toEqual({
      seriesName: "Emily in Paris",
      seasonNumber: 5,
      episodeNumber: 9,
    });
  });

  test("parses series name with ampersand and colon", () => {
    const result = parseEpisodeInfo(
      "Mortimer & Whitehouse: Gone Fishing - s06e01 - Chub - River Irfon, Mid Wales",
    );
    expect(result).toEqual({
      seriesName: "Mortimer & Whitehouse: Gone Fishing",
      seasonNumber: 6,
      episodeNumber: 1,
    });
  });

  test("parses episode title with ampersand", () => {
    const result = parseEpisodeInfo(
      "Too Much - s01e01 - Nonsense & Sensibility",
    );
    expect(result).toEqual({
      seriesName: "Too Much",
      seasonNumber: 1,
      episodeNumber: 1,
    });
  });

  test("parses episode title containing hyphen", () => {
    const result = parseEpisodeInfo(
      "The White Lotus - s01e05 - The Lotus-Eaters",
    );
    expect(result).toEqual({
      seriesName: "The White Lotus",
      seasonNumber: 1,
      episodeNumber: 5,
    });
  });
});

// =============================================================================
// parseTsvLine Tests
// =============================================================================

describe("parseTsvLine", () => {
  test("parses valid TSV line with all fields", () => {
    const line =
      "2024-12-10 16:08:30.6262924\tb5d6d30e2ac747a4823255108059cc19\tb7af0e5e546e09a6923d832b857abe2b\tMovie\tThe Best Christmas Pageant Ever\tTranscode (v:h264 a:eac3)\tJellyfin Web\tEdge Chromium\t47";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.timestampRaw).toBe("2024-12-10 16:08:30.6262924");
    expect(result!.userId).toBe("b5d6d30e2ac747a4823255108059cc19");
    expect(result!.itemId).toBe("b7af0e5e546e09a6923d832b857abe2b");
    expect(result!.itemType).toBe("Movie");
    expect(result!.itemName).toBe("The Best Christmas Pageant Ever");
    expect(result!.playMethodRaw).toBe("Transcode (v:h264 a:eac3)");
    expect(result!.client).toBe("Jellyfin Web");
    expect(result!.deviceName).toBe("Edge Chromium");
    expect(result!.positionSeconds).toBe(47);
    expect(result!.positionKind).toBe("seconds");
    expect(result!.play.mode).toBe("Transcode");
    expect(result!.play.video).toBe("h264");
    expect(result!.play.audio).toBe("eac3");
  });

  test("parses DirectPlay episode", () => {
    const line =
      "2024-12-10 19:43:41.8461341\tb440b40835bd486883e0e2c954ffc942\t84002f277e7922bd1f4143f7e7dd538d\tEpisode\tPerson of Interest - s05e08 - Reassortment\tDirectPlay\tAndroid TV\tRobert's 2nd Fire TV\t2590";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemType).toBe("Episode");
    expect(result!.itemName).toBe("Person of Interest - s05e08 - Reassortment");
    expect(result!.play.mode).toBe("DirectPlay");
    expect(result!.deviceName).toBe("Robert's 2nd Fire TV");
    expect(result!.positionSeconds).toBe(2590);
  });

  test("handles INT32_MIN sentinel value", () => {
    const line =
      "2024-12-11 18:11:59.4126171\te8a3ef7dd9e74f8cb104c21885d1322b\t56d8e5d26ea267a1a305ee811fbf31c2\tEpisode\tOnce Upon a Time - s01e08 - Desperate Souls\tDirectPlay\tJellyfin tvOS\tAppleTV\t-2147483648";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.positionSeconds).toBeUndefined();
    expect(result!.positionKind).toBe("invalid");
  });

  test("handles zero position", () => {
    const line =
      "2024-12-10 22:31:59.143967\te8a3ef7dd9e74f8cb104c21885d1322b\t954a8c565596ed86ba1f8dfc4535a4be\tMovie\tCoco\tDirectPlay\tJellyfin tvOS\tAppleTV\t0";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.positionSeconds).toBe(0);
    expect(result!.positionKind).toBe("seconds");
  });

  test("handles trailing spaces in item name", () => {
    const line =
      "2024-12-10 22:32:30.3095812\te8a3ef7dd9e74f8cb104c21885d1322b\t1db4e3bdbdccc0e88f39e4ca97634751\tMovie\tDear Santa \tDirectPlay\tJellyfin tvOS\tAppleTV\t26";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe("Dear Santa");
    expect(result!.itemNameRaw).toBe("Dear Santa ");
  });

  test("handles Transcode with direct video", () => {
    const line =
      "2024-12-11 09:33:37.570061\tb5d6d30e2ac747a4823255108059cc19\t632d5653248c7ee3a23439a2a7201c7d\tMovie\tFast Charlie \tTranscode (v:direct a:aac)\tJellyfin Web\tEdge Chromium\t58";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.play.mode).toBe("Transcode");
    expect(result!.play.video).toBe("direct");
    expect(result!.play.audio).toBe("aac");
  });

  test("returns null for empty line", () => {
    const result = parseTsvLine("");
    expect(result).toBeNull();
  });

  test("returns null for whitespace-only line", () => {
    const result = parseTsvLine("   \t  ");
    expect(result).toBeNull();
  });

  test("returns null for line with too few columns", () => {
    const line = "2024-12-10\tuser123\titem456";
    const result = parseTsvLine(line);
    expect(result).toBeNull();
  });

  test("parses timestampMs correctly", () => {
    const line =
      "2024-12-10 16:08:30.6262924\tb5d6d30e2ac747a4823255108059cc19\tb7af0e5e546e09a6923d832b857abe2b\tMovie\tTest Movie\tDirectPlay\tClient\tDevice\t100";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.timestampMs).toBeDefined();
    const date = new Date(result!.timestampMs!);
    expect(date.getFullYear()).toBe(2024);
  });

  test("handles device name with parentheses", () => {
    const line =
      "2024-12-10 16:08:30.6262924\tuser123\titem456\tMovie\tTest\tDirectPlay\tRoku\tRoku Express (3930EU)\t100";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.deviceName).toBe("Roku Express (3930EU)");
  });

  test("handles device name with apostrophe", () => {
    const line =
      "2024-12-11 16:01:08.8968267\td49e71b0853c44568e9d2350b93726b6\t8b419d6cfd0c82b5de5b8f8fd741b8c3\tEpisode\tThe Day of the Jackal - s01e09 - Episode 9\tDirectPlay\tAndroid TV\tMary's FireTVStick\t2690";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.deviceName).toBe("Mary's FireTVStick");
  });

  test("handles Jellyfin Mobile iOS client", () => {
    const line =
      "2024-12-13 07:07:21.9559986\tb5d6d30e2ac747a4823255108059cc19\td7158fd48010ade87d6ba50c8dee41e4\tMovie\tGladiator II\tTranscode (v:direct a:aac)\tJellyfin Mobile (iOS)\tiPhone\t22";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Mobile (iOS)");
    expect(result!.deviceName).toBe("iPhone");
  });

  // New tests from December 2025 data batch
  test("handles Jellyfin Android client", () => {
    const line =
      "2025-12-21 04:18:42.7690623\tfe3b3fc3fe0e4dba96102f7e4a4b7c76\t7d6d2417f3b973e35f79e145f3a6f740\tEpisode\tEmily in Paris - s05e02 - Got To Be Real\tTranscode (v:direct a:aac)\tJellyfin Android\tRosanna's A16\t227";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Android");
    expect(result!.deviceName).toBe("Rosanna's A16");
    expect(result!.itemName).toBe("Emily in Paris - s05e02 - Got To Be Real");
  });

  test("handles Jellyfin Media Player client", () => {
    const line =
      "2025-12-21 12:26:41.2257293\t0854a33627394a6b8990640d940adb6b\t1d502f91fed1742fe99527d661dc1261\tMovie\tDate Night\tDirectPlay\tJellyfin Media Player\tLAPTOP-MRELSV2A\t3343";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Media Player");
    expect(result!.deviceName).toBe("LAPTOP-MRELSV2A");
    expect(result!.itemName).toBe("Date Night");
  });

  test("handles Jellyfin Android TV client", () => {
    const line =
      "2025-12-21 18:37:40.7282244\td49e71b0853c44568e9d2350b93726b6\t4106a535e4f8163363265d6a4c031a87\tEpisode\tThe Graham Norton Show - s33e07 - Episode 7\tDirectPlay\tJellyfin Android TV\tMary's FireTVStick\t2665";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Android TV");
    expect(result!.deviceName).toBe("Mary's FireTVStick");
  });

  test("handles Jellyfin Roku client", () => {
    const line =
      "2025-12-21 20:07:31.824215\t2852f03571b44c9998b60c43e59d07d1\t8b68184223d0c30b886abeca2b22155d\tMovie\tThe Gruffalo\tDirectPlay\tJellyfin Roku\tRoku Express (3930EU)\t1661";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Roku");
    expect(result!.deviceName).toBe("Roku Express (3930EU)");
    expect(result!.itemName).toBe("The Gruffalo");
  });

  test("handles Jellyfin iOS client", () => {
    const line =
      "2025-12-21 21:05:25.6654089\t2852f03571b44c9998b60c43e59d07d1\t51dc79876c9c3b8d4a58646b42ba31b6\tEpisode\tThe Middle - s01e07 - The Scratch\tTranscode (v:direct a:direct)\tJellyfin iOS\tClaire's iPhone\t1499";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin iOS");
    expect(result!.deviceName).toBe("Claire's iPhone");
    expect(result!.play.mode).toBe("Transcode");
    expect(result!.play.video).toBe("direct");
    expect(result!.play.audio).toBe("direct");
  });

  test("handles Streaming Stick device with model number", () => {
    const line =
      "2025-12-22 01:14:07.0358678\t8a301b19219b4dee94662b28bcbc3f14\tb9d2d0536fb9f918f23eaccc64227ec0\tEpisode\tBlackadder - s02e03 - Potato\tDirectPlay\tJellyfin Roku\tStreaming Stick (3840X)\t1808";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.deviceName).toBe("Streaming Stick (3840X)");
  });

  test("handles movie title with commas", () => {
    const line =
      "2025-12-21 15:44:38.3393114\te8a3ef7dd9e74f8cb104c21885d1322b\t47c670a6d2d9cdb648ddbb9dfbd81a92\tMovie\tThe Good, the Bad and the Ugly\tDirectPlay\tJellyfin tvOS\tAppleTV\t769";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe("The Good, the Bad and the Ugly");
    expect(result!.itemType).toBe("Movie");
  });

  test("handles movie title with apostrophe", () => {
    const line =
      "2025-12-21 20:35:42.1760638\t2852f03571b44c9998b60c43e59d07d1\t89c5255713e6f0dc527b6ba2fc18ccad\tMovie\tThe Gruffalo's Child\tDirectPlay\tJellyfin Roku\tRoku Express (3930EU)\t1559";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe("The Gruffalo's Child");
  });

  test("handles movie title with colon (subtitle)", () => {
    const line =
      "2025-12-22 10:08:48.3349396\tfe3b3fc3fe0e4dba96102f7e4a4b7c76\t104bc1f00de4e85565db3cdc4ab536a0\tMovie\tWake Up Dead Man: A Knives Out Mystery\tTranscode (v:direct a:aac)\tJellyfin Android\tRosanna's A16\t9";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe("Wake Up Dead Man: A Knives Out Mystery");
  });

  test("handles large position value (long episode)", () => {
    const line =
      "2025-12-21 05:25:52.0178546\tfe3b3fc3fe0e4dba96102f7e4a4b7c76\t6d171c3a9ead8d1b112bb306055da78e\tEpisode\tThe Graham Norton Show - s33e12 - Episode 12\tTranscode (v:direct a:direct)\tJellyfin Android\tRosanna's A16\t4527";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.positionSeconds).toBe(4527);
    expect(result!.positionKind).toBe("seconds");
  });

  test("handles season 00 special episode with multi-part title", () => {
    const line =
      "2025-12-21 21:06:44.2679565\t2852f03571b44c9998b60c43e59d07d1\tb9a3c3b538bb0e66d6f9e93f103988e7\tEpisode\tOnly Fools and Horses - s00e11 - Miami Twice: The American Dream (1)\tDirectPlay\tJellyfin Roku\tRoku Express (3930EU)\t2963";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe(
      "Only Fools and Horses - s00e11 - Miami Twice: The American Dream (1)",
    );

    const episodeInfo = parseEpisodeInfo(result!.itemName);
    expect(episodeInfo.seriesName).toBe("Only Fools and Horses");
    expect(episodeInfo.seasonNumber).toBe(0);
    expect(episodeInfo.episodeNumber).toBe(11);
  });

  test("handles Transcode with h264 and aac", () => {
    const line =
      "2025-12-22 10:30:00.913165\tfe3b3fc3fe0e4dba96102f7e4a4b7c76\t43aa7bca0cb523b862d4277ce2cd896a\tEpisode\tDown Cemetery Road - s01e01 - Almost True\tTranscode (v:h264 a:aac)\tJellyfin Android\tRosanna's A16\t1230";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.play.mode).toBe("Transcode");
    expect(result!.play.video).toBe("h264");
    expect(result!.play.audio).toBe("aac");
  });

  // July 2025 batch - new patterns
  test("handles DirectStream play method with Streamyfin client", () => {
    const line =
      "2025-07-15 11:54:35.2836797\tb5d6d30e2ac747a4823255108059cc19\t30fed7a6ff7bec04f41c0c9eee42dacb\tEpisode\tThe Lotus Eaters - s01e01 - A Cool Wind From the North\tDirectStream\tStreamyfin\tiPhone\t4";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.play.mode).toBe("DirectStream");
    expect(result!.client).toBe("Streamyfin");
    expect(result!.deviceName).toBe("iPhone");
    expect(result!.itemName).toBe(
      "The Lotus Eaters - s01e01 - A Cool Wind From the North",
    );
  });

  test("handles Jellyfin Mobile iPadOS client", () => {
    const line =
      "2025-07-14 13:40:24.098019\te8a3ef7dd9e74f8cb104c21885d1322b\tc6e963918153e0823f089a8e65ce46a1\tEpisode\tClarkson's Farm - s02e04 - Badgering\tTranscode (v:direct a:aac)\tJellyfin Mobile (iPadOS)\tiPad (2)\t788";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.client).toBe("Jellyfin Mobile (iPadOS)");
    expect(result!.deviceName).toBe("iPad (2)");
    expect(result!.itemName).toBe("Clarkson's Farm - s02e04 - Badgering");
  });

  test("handles series name with ampersand and colon", () => {
    const line =
      "2025-07-15 19:48:45.1451889\te8a3ef7dd9e74f8cb104c21885d1322b\t07143e396df72177bff9f8ba38857122\tEpisode\tMortimer & Whitehouse: Gone Fishing - s06e01 - Chub - River Irfon, Mid Wales\tDirectPlay\tJellyfin tvOS\tAppleTV\t0";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe(
      "Mortimer & Whitehouse: Gone Fishing - s06e01 - Chub - River Irfon, Mid Wales",
    );

    const episodeInfo = parseEpisodeInfo(result!.itemName);
    expect(episodeInfo.seriesName).toBe("Mortimer & Whitehouse: Gone Fishing");
    expect(episodeInfo.seasonNumber).toBe(6);
    expect(episodeInfo.episodeNumber).toBe(1);
  });

  test("handles episode title with ampersand", () => {
    const line =
      "2025-07-15 16:49:12.0359603\td49e71b0853c44568e9d2350b93726b6\t202c59c461d3b6912eaf51db9bc0e204\tEpisode\tToo Much - s01e01 - Nonsense & Sensibility\tDirectPlay\tAndroid TV\tMary's FireTVStick\t2096";
    const result = parseTsvLine(line);

    expect(result).not.toBeNull();
    expect(result!.itemName).toBe("Too Much - s01e01 - Nonsense & Sensibility");

    const episodeInfo = parseEpisodeInfo(result!.itemName);
    expect(episodeInfo.seriesName).toBe("Too Much");
    expect(episodeInfo.seasonNumber).toBe(1);
    expect(episodeInfo.episodeNumber).toBe(1);
  });
});

// =============================================================================
// isValidHex32 Tests
// =============================================================================

describe("isValidHex32", () => {
  test("validates correct 32-char hex string", () => {
    expect(isValidHex32("b5d6d30e2ac747a4823255108059cc19")).toBe(true);
  });

  test("validates uppercase hex", () => {
    expect(isValidHex32("B5D6D30E2AC747A4823255108059CC19")).toBe(true);
  });

  test("validates mixed case hex", () => {
    expect(isValidHex32("b5d6D30e2AC747a4823255108059CC19")).toBe(true);
  });

  test("rejects too short string", () => {
    expect(isValidHex32("b5d6d30e2ac747a4")).toBe(false);
  });

  test("rejects too long string", () => {
    expect(isValidHex32("b5d6d30e2ac747a4823255108059cc19aa")).toBe(false);
  });

  test("rejects non-hex characters", () => {
    expect(isValidHex32("b5d6d30e2ac747a4823255108059ccgg")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isValidHex32("")).toBe(false);
  });

  test("rejects string with spaces", () => {
    expect(isValidHex32("b5d6d30e 2ac747a4 82325510 8059cc19")).toBe(false);
  });

  test("rejects string with hyphens (UUID format)", () => {
    expect(isValidHex32("b5d6d30e-2ac7-47a4-8232-55108059cc19")).toBe(false);
  });
});

// =============================================================================
// Integration Tests - Full Row Parsing
// =============================================================================

describe("parseTsvLine integration", () => {
  const sampleLines = [
    // December 2024 batch
    "2024-12-10 16:08:30.6262924\tb5d6d30e2ac747a4823255108059cc19\tb7af0e5e546e09a6923d832b857abe2b\tMovie\tThe Best Christmas Pageant Ever\tTranscode (v:h264 a:eac3)\tJellyfin Web\tEdge Chromium\t47",
    "2024-12-10 19:43:41.8461341\tb440b40835bd486883e0e2c954ffc942\t84002f277e7922bd1f4143f7e7dd538d\tEpisode\tPerson of Interest - s05e08 - Reassortment\tDirectPlay\tAndroid TV\tRobert's 2nd Fire TV\t2590",
    "2024-12-11 18:11:59.4126171\te8a3ef7dd9e74f8cb104c21885d1322b\t56d8e5d26ea267a1a305ee811fbf31c2\tEpisode\tOnce Upon a Time - s01e08 - Desperate Souls\tDirectPlay\tJellyfin tvOS\tAppleTV\t-2147483648",
    "2024-12-13 20:36:04.6750803\tb440b40835bd486883e0e2c954ffc942\t9304f5962811afb12a54f7ea64625589\tEpisode\tCarnivàle - s01e01 - Milfay\tDirectPlay\tAndroid TV\tRobert's 2nd Fire TV\t458",
    // December 2025 batch - new clients and patterns
    "2025-12-21 04:18:42.7690623\tfe3b3fc3fe0e4dba96102f7e4a4b7c76\t7d6d2417f3b973e35f79e145f3a6f740\tEpisode\tEmily in Paris - s05e02 - Got To Be Real\tTranscode (v:direct a:aac)\tJellyfin Android\tRosanna's A16\t227",
    "2025-12-21 12:26:41.2257293\t0854a33627394a6b8990640d940adb6b\t1d502f91fed1742fe99527d661dc1261\tMovie\tDate Night\tDirectPlay\tJellyfin Media Player\tLAPTOP-MRELSV2A\t3343",
    "2025-12-21 15:44:38.3393114\te8a3ef7dd9e74f8cb104c21885d1322b\t47c670a6d2d9cdb648ddbb9dfbd81a92\tMovie\tThe Good, the Bad and the Ugly\tDirectPlay\tJellyfin tvOS\tAppleTV\t769",
    "2025-12-21 20:07:31.824215\t2852f03571b44c9998b60c43e59d07d1\t8b68184223d0c30b886abeca2b22155d\tMovie\tThe Gruffalo\tDirectPlay\tJellyfin Roku\tRoku Express (3930EU)\t1661",
    "2025-12-21 21:05:25.6654089\t2852f03571b44c9998b60c43e59d07d1\t51dc79876c9c3b8d4a58646b42ba31b6\tEpisode\tThe Middle - s01e07 - The Scratch\tTranscode (v:direct a:direct)\tJellyfin iOS\tClaire's iPhone\t1499",
    "2025-12-22 01:14:07.0358678\t8a301b19219b4dee94662b28bcbc3f14\tb9d2d0536fb9f918f23eaccc64227ec0\tEpisode\tBlackadder - s02e03 - Potato\tDirectPlay\tJellyfin Roku\tStreaming Stick (3840X)\t1808",
    // July 2025 batch - DirectStream and new clients
    "2025-07-15 11:54:35.2836797\tb5d6d30e2ac747a4823255108059cc19\t30fed7a6ff7bec04f41c0c9eee42dacb\tEpisode\tThe Lotus Eaters - s01e01 - A Cool Wind From the North\tDirectStream\tStreamyfin\tiPhone\t4",
    "2025-07-14 13:40:24.098019\te8a3ef7dd9e74f8cb104c21885d1322b\tc6e963918153e0823f089a8e65ce46a1\tEpisode\tClarkson's Farm - s02e04 - Badgering\tTranscode (v:direct a:aac)\tJellyfin Mobile (iPadOS)\tiPad (2)\t788",
    "2025-07-15 19:48:45.1451889\te8a3ef7dd9e74f8cb104c21885d1322b\t07143e396df72177bff9f8ba38857122\tEpisode\tMortimer & Whitehouse: Gone Fishing - s06e01 - Chub - River Irfon, Mid Wales\tDirectPlay\tJellyfin tvOS\tAppleTV\t0",
  ];

  test("all sample lines parse successfully", () => {
    for (const line of sampleLines) {
      const result = parseTsvLine(line);
      expect(result).not.toBeNull();
    }
  });

  test("sample lines have valid hex32 userIds", () => {
    for (const line of sampleLines) {
      const result = parseTsvLine(line);
      expect(result).not.toBeNull();
      expect(isValidHex32(result!.userId)).toBe(true);
    }
  });

  test("sample lines have valid hex32 itemIds", () => {
    for (const line of sampleLines) {
      const result = parseTsvLine(line);
      expect(result).not.toBeNull();
      expect(isValidHex32(result!.itemId)).toBe(true);
    }
  });

  test("episode lines can extract episode info", () => {
    const episodeLine = sampleLines[1];
    const result = parseTsvLine(episodeLine);
    expect(result).not.toBeNull();

    const episodeInfo = parseEpisodeInfo(result!.itemName);
    expect(episodeInfo.seriesName).toBe("Person of Interest");
    expect(episodeInfo.seasonNumber).toBe(5);
    expect(episodeInfo.episodeNumber).toBe(8);
  });

  test("movie lines return null episode info", () => {
    const movieLine = sampleLines[0];
    const result = parseTsvLine(movieLine);
    expect(result).not.toBeNull();

    const episodeInfo = parseEpisodeInfo(result!.itemName);
    expect(episodeInfo.seriesName).toBeNull();
    expect(episodeInfo.seasonNumber).toBeNull();
    expect(episodeInfo.episodeNumber).toBeNull();
  });
});
