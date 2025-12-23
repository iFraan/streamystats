import { describe, expect, test } from "bun:test";
import {
  parseActivityName,
  getDeviceOrClientFromActivity,
  parseIpFromShortOverview,
  type ParsedActivityName,
} from "./geolocation";

describe("parseActivityName", () => {
  // ============================================================
  // PRODUCTION DATA TEST CASES - Add new cases here
  // ============================================================

  const testCases: Array<{
    name: string;
    input: { activityName: string | null; activityType: string | null };
    expected: ParsedActivityName;
  }> = [
    // -------------------- VideoPlayback --------------------
    {
      name: "VideoPlayback: iPhone with user prefix in device name",
      input: {
        activityName:
          "parisahashem is playing Modern Family - Blasts from the Past on Parisa  iPhone",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "parisahashem",
        mediaTitle: "Modern Family - Blasts from the Past",
        playbackDevice: "Parisa  iPhone",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: Apple TV",
      input: {
        activityName:
          "fredrik is playing Percy Jackson and the Olympians - I Play Dodgeball With Cannibals on Apple TV",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "fredrik",
        mediaTitle:
          "Percy Jackson and the Olympians - I Play Dodgeball With Cannibals",
        playbackDevice: "Apple TV",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: Chrome browser",
      input: {
        activityName:
          "Irma is playing Love Island Australia - Episode 28 on Chrome",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "Irma",
        mediaTitle: "Love Island Australia - Episode 28",
        playbackDevice: "Chrome",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: Samsung Smart TV",
      input: {
        activityName:
          "dh is playing Pirates of the Caribbean: The Curse of the Black Pearl on Samsung Smart TV",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "dh",
        mediaTitle: "Pirates of the Caribbean: The Curse of the Black Pearl",
        playbackDevice: "Samsung Smart TV",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: iPad",
      input: {
        activityName:
          "johanandre is playing Now You See Me: Now You Don't on iPad",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "johanandre",
        mediaTitle: "Now You See Me: Now You Don't",
        playbackDevice: "iPad",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: title with 'on' in it (edge case)",
      input: {
        activityName: "user is playing The Story on Main Street on iPhone",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "user",
        mediaTitle: "The Story on Main Street",
        playbackDevice: "iPhone",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: movie without series info",
      input: {
        activityName: "johanandre is playing 2012 on iPad",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "johanandre",
        mediaTitle: "2012",
        playbackDevice: "iPad",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlayback: One Battle After Another on iPad",
      input: {
        activityName: "fredrik is playing One Battle After Another on iPad",
        activityType: "VideoPlayback",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: "One Battle After Another",
        playbackDevice: "iPad",
        sessionClient: null,
      },
    },

    // -------------------- VideoPlaybackStopped --------------------
    {
      name: "VideoPlaybackStopped: iPhone",
      input: {
        activityName:
          "parisahashem has finished playing Modern Family - A Moving Day on Parisa  iPhone",
        activityType: "VideoPlaybackStopped",
      },
      expected: {
        userName: "parisahashem",
        mediaTitle: "Modern Family - A Moving Day",
        playbackDevice: "Parisa  iPhone",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlaybackStopped: Chrome",
      input: {
        activityName:
          "Irma has finished playing Love Island Australia - Episode 27 on Chrome",
        activityType: "VideoPlaybackStopped",
      },
      expected: {
        userName: "Irma",
        mediaTitle: "Love Island Australia - Episode 27",
        playbackDevice: "Chrome",
        sessionClient: null,
      },
    },
    {
      name: "VideoPlaybackStopped: Apple TV",
      input: {
        activityName:
          "fredrik has finished playing Percy Jackson and the Olympians - I Play Dodgeball With Cannibals on Apple TV",
        activityType: "VideoPlaybackStopped",
      },
      expected: {
        userName: "fredrik",
        mediaTitle:
          "Percy Jackson and the Olympians - I Play Dodgeball With Cannibals",
        playbackDevice: "Apple TV",
        sessionClient: null,
      },
    },

    // -------------------- SessionStarted --------------------
    {
      name: "SessionStarted: Firefox",
      input: {
        activityName: "fredrik is online from Firefox",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Firefox",
      },
    },
    {
      name: "SessionStarted: iPhone",
      input: {
        activityName: "Belle is online from iPhone",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "Belle",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "iPhone",
      },
    },
    {
      name: "SessionStarted: Jellyfin Server",
      input: {
        activityName: "fredrik is online from Jellyfin Server",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Jellyfin Server",
      },
    },
    {
      name: "SessionStarted: Apple TV",
      input: {
        activityName: "johanandre is online from Apple TV",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "johanandre",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Apple TV",
      },
    },
    {
      name: "SessionStarted: custom device name with spaces",
      input: {
        activityName: "parisahashem is online from Parisa  iPhone",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "parisahashem",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Parisa  iPhone",
      },
    },
    {
      name: "SessionStarted: Chrome",
      input: {
        activityName: "Irma is online from Chrome",
        activityType: "SessionStarted",
      },
      expected: {
        userName: "Irma",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Chrome",
      },
    },

    // -------------------- SessionEnded --------------------
    {
      name: "SessionEnded: Firefox",
      input: {
        activityName: "fredrik has disconnected from Firefox",
        activityType: "SessionEnded",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Firefox",
      },
    },
    {
      name: "SessionEnded: iPhone",
      input: {
        activityName: "Belle has disconnected from iPhone",
        activityType: "SessionEnded",
      },
      expected: {
        userName: "Belle",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "iPhone",
      },
    },
    {
      name: "SessionEnded: Jellyfin Server",
      input: {
        activityName: "fredrik has disconnected from Jellyfin Server",
        activityType: "SessionEnded",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Jellyfin Server",
      },
    },
    {
      name: "SessionEnded: custom device name",
      input: {
        activityName: "parisahashem has disconnected from Parisa  iPhone",
        activityType: "SessionEnded",
      },
      expected: {
        userName: "parisahashem",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Parisa  iPhone",
      },
    },
    {
      name: "SessionEnded: Apple TV",
      input: {
        activityName: "johanandre has disconnected from Apple TV",
        activityType: "SessionEnded",
      },
      expected: {
        userName: "johanandre",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: "Apple TV",
      },
    },

    // -------------------- AuthenticationSucceeded --------------------
    {
      name: "AuthenticationSucceeded: no device",
      input: {
        activityName: "fredrik successfully authenticated",
        activityType: "AuthenticationSucceeded",
      },
      expected: {
        userName: "fredrik",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: null,
      },
    },
    {
      name: "AuthenticationSucceeded: another user",
      input: {
        activityName: "johanandre successfully authenticated",
        activityType: "AuthenticationSucceeded",
      },
      expected: {
        userName: "johanandre",
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: null,
      },
    },

    // -------------------- Edge cases --------------------
    {
      name: "null activityName",
      input: { activityName: null, activityType: "VideoPlayback" },
      expected: {
        userName: null,
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: null,
      },
    },
    {
      name: "null activityType",
      input: { activityName: "some random text", activityType: null },
      expected: {
        userName: null,
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: null,
      },
    },
    {
      name: "unknown activityType",
      input: { activityName: "user did something", activityType: "UnknownType" },
      expected: {
        userName: null,
        mediaTitle: null,
        playbackDevice: null,
        sessionClient: null,
      },
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = parseActivityName(
        tc.input.activityName,
        tc.input.activityType
      );
      expect(result).toEqual(tc.expected);
    });
  }
});

describe("getDeviceOrClientFromActivity", () => {
  test("returns playbackDevice for VideoPlayback", () => {
    expect(
      getDeviceOrClientFromActivity(
        "user is playing Movie on Apple TV",
        "VideoPlayback"
      )
    ).toBe("Apple TV");
  });

  test("returns sessionClient for SessionStarted", () => {
    expect(
      getDeviceOrClientFromActivity("user is online from Chrome", "SessionStarted")
    ).toBe("Chrome");
  });

  test("returns sessionClient for SessionEnded", () => {
    expect(
      getDeviceOrClientFromActivity(
        "user has disconnected from Firefox",
        "SessionEnded"
      )
    ).toBe("Firefox");
  });

  test("returns null for auth events", () => {
    expect(
      getDeviceOrClientFromActivity(
        "user successfully authenticated",
        "AuthenticationSucceeded"
      )
    ).toBe(null);
  });

  test("returns null for null input", () => {
    expect(getDeviceOrClientFromActivity(null, "VideoPlayback")).toBe(null);
  });
});

describe("parseIpFromShortOverview", () => {
  const testCases: Array<{
    name: string;
    input: string | null;
    expected: string | null;
  }> = [
    {
      name: "standard format",
      input: "IP address: 94.191.138.22",
      expected: "94.191.138.22",
    },
    {
      name: "private IP",
      input: "IP address: 192.168.1.1",
      expected: "192.168.1.1",
    },
    {
      name: "docker bridge IP",
      input: "IP address: 172.17.0.1",
      expected: "172.17.0.1",
    },
    { name: "null input", input: null, expected: null },
    { name: "empty string", input: "", expected: null },
    { name: "no IP present", input: "some other text", expected: null },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      expect(parseIpFromShortOverview(tc.input)).toBe(tc.expected);
    });
  }
});

