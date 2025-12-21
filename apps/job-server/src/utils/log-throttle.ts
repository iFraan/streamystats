type ThrottleState = {
  lastLoggedAtMs: number;
  suppressed: number;
};

const stateByKey = new Map<string, ThrottleState>();

/**
 * Log at most once per interval for the same key.
 *
 * If calls are suppressed, the next emitted log receives the number of
 * suppressed calls since the previous emitted log.
 */
export function logThrottled(
  key: string,
  intervalMs: number,
  write: (meta: { suppressed: number }) => void
): void {
  const now = Date.now();
  const state = stateByKey.get(key);

  if (!state) {
    stateByKey.set(key, { lastLoggedAtMs: now, suppressed: 0 });
    write({ suppressed: 0 });
    return;
  }

  if (now - state.lastLoggedAtMs >= intervalMs) {
    const suppressed = state.suppressed;
    state.lastLoggedAtMs = now;
    state.suppressed = 0;
    write({ suppressed });
    return;
  }

  state.suppressed += 1;
}

export function resetLogThrottle(key: string): void {
  stateByKey.delete(key);
}

type Entry = {
  lastAt: number;
};

const entries = new Map<string, Entry>();

function nowMs(): number {
  return Date.now();
}

function pruneIfNeeded(maxEntries: number): void {
  if (entries.size <= maxEntries) return;

  const items = Array.from(entries.entries());
  items.sort((a, b) => a[1].lastAt - b[1].lastAt);

  const toRemove = Math.max(0, items.length - maxEntries);
  for (let i = 0; i < toRemove; i++) {
    entries.delete(items[i]![0]);
  }
}

/**
 * Returns true if we should emit a log for `key` right now, based on `windowMs`.
 * This is intended to prevent repeated "server is down" errors from spamming logs.
 */
export function shouldLog(key: string, windowMs: number): boolean {
  const now = nowMs();
  const prev = entries.get(key);

  if (prev && now - prev.lastAt < windowMs) {
    return false;
  }

  entries.set(key, { lastAt: now });
  pruneIfNeeded(5000);
  return true;
}


