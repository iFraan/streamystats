"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type JobEvent, useJobEvents } from "@/hooks/useJobEvents";
import {
  JOB_NAME_TO_KEY,
  type ServerJobState,
  type ServerJobStatusItem,
  type ServerJobStatusResponse,
} from "@/lib/types/job-status";
import { fetch } from "@/lib/utils";

function getStateBadgeClass(state: ServerJobState): string {
  switch (state) {
    case "running":
      return "text-white bg-blue-600 border-blue-700";
    case "queued":
      return "text-white bg-amber-500 border-amber-600";
    case "scheduled":
      return "text-white bg-slate-500 border-slate-600";
    case "failed":
      return "text-white bg-red-600 border-red-700";
    case "cancelled":
      return "text-white bg-slate-400 border-slate-500";
    case "stopped":
      return "text-zinc-300 bg-zinc-700 border-zinc-600";
  }
}

async function fetchServerJobStatus(
  serverId: number,
): Promise<ServerJobStatusResponse> {
  const response = await fetch(`/api/jobs/servers/${serverId}/status`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

function updateJobFromEvent(
  jobs: ServerJobStatusItem[],
  event: JobEvent,
): ServerJobStatusItem[] {
  if (!event.jobName) return jobs;

  const jobKey = JOB_NAME_TO_KEY[event.jobName];
  if (!jobKey) return jobs;

  return jobs.map((job) => {
    if (job.key !== jobKey) return job;

    const now = new Date().toISOString();

    switch (event.type) {
      case "started":
        return {
          ...job,
          state: "running" as const,
          activeSince: now,
          updatedAt: now,
          lastError: undefined,
        };
      case "completed":
        return {
          ...job,
          state: "stopped" as const,
          activeSince: undefined,
          updatedAt: now,
          lastError: undefined,
        };
      case "failed":
        return {
          ...job,
          state: "failed" as const,
          activeSince: undefined,
          updatedAt: now,
          lastError: event.error,
        };
      default:
        return job;
    }
  });
}

export function ServerJobStatusCard({ serverId }: { serverId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["serverJobStatus", serverId],
    queryFn: () => fetchServerJobStatus(serverId),
    staleTime: Number.POSITIVE_INFINITY, // Don't refetch - SSE handles updates
    retry: 2,
  });

  const [jobs, setJobs] = useState<ServerJobStatusItem[]>([]);

  // Sync initial data to local state
  useEffect(() => {
    if (data?.jobs) {
      setJobs(data.jobs);
    }
  }, [data?.jobs]);

  // Handle SSE events for real-time updates
  const handleJobEvent = useCallback(
    (event: JobEvent) => {
      if (event.serverId !== serverId) return;
      if (!event.jobName) return;

      setJobs((prev) => updateJobFromEvent(prev, event));
    },
    [serverId],
  );

  useJobEvents({ onJobEvent: handleJobEvent });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Not available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.key}
            className="flex items-start justify-between gap-3 border rounded-md p-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{job.label}</div>
              {job.state === "running" && job.activeSince ? (
                <div className="text-xs text-muted-foreground mt-1">
                  running since {new Date(job.activeSince).toLocaleTimeString()}
                </div>
              ) : null}
              {job.state === "scheduled" && job.scheduledFor ? (
                <div className="text-xs text-muted-foreground mt-1">
                  scheduled for{" "}
                  {new Date(job.scheduledFor).toLocaleTimeString()}
                </div>
              ) : null}
              {job.state === "failed" && job.lastError ? (
                <div className="text-xs text-red-600 mt-1 break-words">
                  {job.lastError}
                </div>
              ) : null}
            </div>
            <div className="flex-shrink-0">
              <Badge className={getStateBadgeClass(job.state)}>
                {job.state}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
