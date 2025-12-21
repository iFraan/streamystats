"use client";

import { useCallback, useEffect, useRef } from "react";

export type JobEvent = {
  type:
    | "hello"
    | "ping"
    | "started"
    | "completed"
    | "failed"
    | "progress"
    | "anomaly_detected";
  epochMs?: number;
  jobId?: string;
  jobName?: string;
  serverId?: number;
  progress?: { current?: number; total?: number; percent?: number };
  data?: unknown;
  error?: string;
  timestamp: string;
};

export function useJobEvents(options: {
  onJobEvent: (event: JobEvent) => void;
}) {
  const { onJobEvent } = options;

  const lastEventEpochRef = useRef<number | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  // Use a ref to store the callback to avoid re-running the effect when callback changes
  const onJobEventRef = useRef(onJobEvent);

  // Keep the ref in sync with the latest callback
  useEffect(() => {
    onJobEventRef.current = onJobEvent;
  }, [onJobEvent]);

  useEffect(() => {
    let reconnectTimer: number | null = null;
    let isMounted = true;

    const connect = (since?: number) => {
      // Don't create new connections if component is unmounted
      if (!isMounted) return;

      const url = new URL("/api/jobs/events", window.location.origin);
      if (since) url.searchParams.set("since", String(since));

      const es = new EventSource(url.toString());
      sourceRef.current = es;

      es.addEventListener("job", (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data) as JobEvent;
          // Use ref to always call the latest callback version
          onJobEventRef.current(data);

          if (typeof data.epochMs === "number") {
            lastEventEpochRef.current = data.epochMs;
          } else {
            lastEventEpochRef.current = Date.now();
          }
        } catch {
          // Ignore malformed events
        }
      });

      es.addEventListener("hello", () => {
        // no-op
      });

      es.addEventListener("ping", () => {
        // no-op
      });

      es.onerror = () => {
        es.close();

        // Don't attempt reconnection if component is unmounted
        if (!isMounted) return;

        if (reconnectTimer) {
          window.clearTimeout(reconnectTimer);
        }

        const sinceEpoch = lastEventEpochRef.current ?? undefined;
        reconnectTimer = window.setTimeout(() => connect(sinceEpoch), 1500);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, []); // Empty deps - only run once, callback changes are handled via ref
}
