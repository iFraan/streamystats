"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { type JobEvent, useJobEvents } from "@/hooks/useJobEvents";

interface SecuritySyncButtonProps {
  serverId: number;
}

const SECURITY_SYNC_JOB = "security-full-sync";

export function SecuritySyncButton({ serverId }: SecuritySyncButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  const handleJobEvent = useCallback(
    (event: JobEvent) => {
      if (event.serverId !== serverId) return;
      if (event.jobName !== SECURITY_SYNC_JOB) return;

      if (event.type === "started" || event.type === "progress") {
        setIsRunning(true);
      } else if (event.type === "completed") {
        setIsRunning(false);
        router.refresh();
      } else if (event.type === "failed") {
        setIsRunning(false);
      }
    },
    [serverId, router],
  );

  useJobEvents({ onJobEvent: handleJobEvent });

  const triggerSync = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/jobs/trigger-security-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });
      if (!res.ok) {
        setIsRunning(false);
      }
    } catch {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={triggerSync}
      disabled={isRunning}
      title="Sync security data"
      className="h-8 w-8"
    >
      <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
    </Button>
  );
}
