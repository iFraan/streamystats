import geoip from "geoip-lite";

export interface GeoLocation {
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export interface GeoLocationResult {
  geo: GeoLocation;
  isPrivateIp: boolean;
}

// Country code to name mapping (ISO 3166-1 alpha-2)
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  JP: "Japan",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  RU: "Russia",
  KR: "South Korea",
  IT: "Italy",
  ES: "Spain",
  MX: "Mexico",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  NZ: "New Zealand",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  IE: "Ireland",
  PT: "Portugal",
  CZ: "Czech Republic",
  GR: "Greece",
  IL: "Israel",
  ZA: "South Africa",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  TH: "Thailand",
  MY: "Malaysia",
  PH: "Philippines",
  ID: "Indonesia",
  VN: "Vietnam",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  EG: "Egypt",
  TR: "Turkey",
  UA: "Ukraine",
  RO: "Romania",
  HU: "Hungary",
  SK: "Slovakia",
  BG: "Bulgaria",
  HR: "Croatia",
  RS: "Serbia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  IS: "Iceland",
  LU: "Luxembourg",
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

/**
 * Check if an IP address is a private/internal IP
 * Covers: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, and IPv6 local
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv6
  if (ip.includes(":")) {
    // IPv6 loopback
    if (ip === "::1") return true;
    // IPv6 link-local (fe80::)
    if (ip.toLowerCase().startsWith("fe80:")) return true;
    // IPv6 unique local (fc00:: or fd00::)
    if (
      ip.toLowerCase().startsWith("fc") ||
      ip.toLowerCase().startsWith("fd")
    ) {
      return true;
    }
    return false;
  }

  // Handle IPv4
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;
  // 169.254.0.0/16 (link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0
  if (parts.every((p) => p === 0)) return true;

  return false;
}

/**
 * Geolocate an IP address using geoip-lite
 * Returns null geo data for private IPs
 */
export function geolocateIp(ip: string): GeoLocationResult {
  const privateIp = isPrivateIp(ip);

  if (privateIp) {
    return {
      geo: {
        countryCode: null,
        country: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        timezone: null,
      },
      isPrivateIp: true,
    };
  }

  const result = geoip.lookup(ip);

  if (!result) {
    return {
      geo: {
        countryCode: null,
        country: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        timezone: null,
      },
      isPrivateIp: false,
    };
  }

  return {
    geo: {
      countryCode: result.country || null,
      country: result.country ? getCountryName(result.country) : null,
      region: result.region || null,
      city: result.city || null,
      latitude: result.ll?.[0] ?? null,
      longitude: result.ll?.[1] ?? null,
      timezone: result.timezone || null,
    },
    isPrivateIp: false,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if travel between two locations in a given time is physically possible
 * Uses a threshold of 900 km/h (slightly above commercial jet speed)
 * Returns the calculated speed if impossible, null if possible
 */
export function checkImpossibleTravel(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  timeDiffMinutes: number
): { speedKmh: number; distanceKm: number } | null {
  const IMPOSSIBLE_SPEED_KMH = 900;

  if (timeDiffMinutes <= 0) {
    // Concurrent access from different locations
    const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
    if (distanceKm > 100) {
      // More than 100km apart
      return { speedKmh: Number.POSITIVE_INFINITY, distanceKm };
    }
    return null;
  }

  const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
  const speedKmh = distanceKm / (timeDiffMinutes / 60);

  if (speedKmh > IMPOSSIBLE_SPEED_KMH) {
    return { speedKmh, distanceKm };
  }

  return null;
}

/**
 * Normalize IP address (handle IPv4-mapped IPv6 addresses)
 */
export function normalizeIp(ip: string): string {
  if (!ip) return ip;

  // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
}

/**
 * Extract IP address from activity shortOverview field
 * Formats: "IP address: 192.168.1.1" or similar patterns
 */
export function parseIpFromShortOverview(
  shortOverview: string | null
): string | null {
  if (!shortOverview) return null;

  // Pattern: "IP address: X.X.X.X" or "IP: X.X.X.X"
  const ipPattern = /IP(?:\s+address)?:\s*([0-9a-fA-F.:]+)/i;
  const match = shortOverview.match(ipPattern);

  if (match?.[1]) {
    return normalizeIp(match[1]);
  }

  // Try to find any IP-like pattern as fallback
  const ipv4Pattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/;
  const ipv4Match = shortOverview.match(ipv4Pattern);

  if (ipv4Match?.[1]) {
    return normalizeIp(ipv4Match[1]);
  }

  return null;
}

export interface ParsedActivityName {
  userName: string | null;
  mediaTitle: string | null;
  playbackDevice: string | null; // from "on Device" in playback events
  sessionClient: string | null; // from "from Client" in session events
}

/**
 * Centralized delimiters for activity name parsing.
 * Keeps patterns in one place to simplify maintenance if Jellyfin changes wording.
 */
const ACTIVITY_DELIMITERS = {
  playback: {
    device: " on ",
    action: " is playing ",
  },
  playbackStopped: {
    device: " on ",
    action: " has finished playing ",
  },
  sessionStarted: {
    client: " from ",
    action: " is online",
  },
  sessionEnded: {
    client: " from ",
    action: " has disconnected",
  },
  auth: {
    action: " successfully authenticated",
  },
} as const;

/**
 * Parse structured fields from activity name based on type.
 * Uses lastIndexOf to handle edge cases (e.g., titles containing " on ").
 * Delimiter lengths are derived from constants to avoid magic numbers.
 *
 * Patterns:
 *   VideoPlayback:        "[user] is playing [title] on [device]"
 *   VideoPlaybackStopped: "[user] has finished playing [title] on [device]"
 *   SessionStarted:       "[user] is online from [client]"
 *   SessionEnded:         "[user] has disconnected from [client]"
 *   AuthenticationSucceeded: "[user] successfully authenticated"
 */
export function parseActivityName(
  activityName: string | null,
  activityType: string | null
): ParsedActivityName {
  const result: ParsedActivityName = {
    userName: null,
    mediaTitle: null,
    playbackDevice: null,
    sessionClient: null,
  };

  if (!activityName || !activityType) return result;

  // VideoPlayback: "[user] is playing [title] on [device]"
  if (activityType === "VideoPlayback") {
    const { device, action } = ACTIVITY_DELIMITERS.playback;
    const deviceIndex = activityName.lastIndexOf(device);
    if (deviceIndex === -1) return result;

    result.playbackDevice =
      activityName.slice(deviceIndex + device.length).trim() || null;

    const prefix = activityName.slice(0, deviceIndex);
    const actionIndex = prefix.indexOf(action);
    if (actionIndex !== -1) {
      result.userName = prefix.slice(0, actionIndex).trim() || null;
      result.mediaTitle =
        prefix.slice(actionIndex + action.length).trim() || null;
    }
    return result;
  }

  // VideoPlaybackStopped: "[user] has finished playing [title] on [device]"
  if (activityType === "VideoPlaybackStopped") {
    const { device, action } = ACTIVITY_DELIMITERS.playbackStopped;
    const deviceIndex = activityName.lastIndexOf(device);
    if (deviceIndex === -1) return result;

    result.playbackDevice =
      activityName.slice(deviceIndex + device.length).trim() || null;

    const prefix = activityName.slice(0, deviceIndex);
    const actionIndex = prefix.indexOf(action);
    if (actionIndex !== -1) {
      result.userName = prefix.slice(0, actionIndex).trim() || null;
      result.mediaTitle =
        prefix.slice(actionIndex + action.length).trim() || null;
    }
    return result;
  }

  // SessionStarted: "[user] is online from [client]"
  if (activityType === "SessionStarted") {
    const { client, action } = ACTIVITY_DELIMITERS.sessionStarted;
    const clientIndex = activityName.lastIndexOf(client);
    if (clientIndex === -1) return result;

    result.sessionClient =
      activityName.slice(clientIndex + client.length).trim() || null;

    const prefix = activityName.slice(0, clientIndex);
    const actionIndex = prefix.indexOf(action);
    if (actionIndex !== -1) {
      result.userName = prefix.slice(0, actionIndex).trim() || null;
    }
    return result;
  }

  // SessionEnded: "[user] has disconnected from [client]"
  if (activityType === "SessionEnded") {
    const { client, action } = ACTIVITY_DELIMITERS.sessionEnded;
    const clientIndex = activityName.lastIndexOf(client);
    if (clientIndex === -1) return result;

    result.sessionClient =
      activityName.slice(clientIndex + client.length).trim() || null;

    const prefix = activityName.slice(0, clientIndex);
    const actionIndex = prefix.indexOf(action);
    if (actionIndex !== -1) {
      result.userName = prefix.slice(0, actionIndex).trim() || null;
    }
    return result;
  }

  // AuthenticationSucceeded: "[user] successfully authenticated"
  if (activityType === "AuthenticationSucceeded") {
    const { action } = ACTIVITY_DELIMITERS.auth;
    const actionIndex = activityName.indexOf(action);
    if (actionIndex !== -1) {
      result.userName = activityName.slice(0, actionIndex).trim() || null;
    }
    return result;
  }

  return result;
}

/**
 * Convenience function: get device or client from activity (unified lookup)
 */
export function getDeviceOrClientFromActivity(
  activityName: string | null,
  activityType: string | null
): string | null {
  const parsed = parseActivityName(activityName, activityType);
  return parsed.playbackDevice || parsed.sessionClient;
}
