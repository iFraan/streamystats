"use client";

import {
  AlertCircle,
  Globe,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { triggerGeolocationBackfill } from "@/lib/db/locations";

interface SecurityStatsProps {
  stats: {
    totalLocatedActivities: number;
    pendingActivities: number;
    uniqueCountries: number;
    uniqueCities: number;
    usersWithFingerprints: number;
    unresolvedAnomalies: Record<string, number>;
    isBackfillRunning: boolean;
  };
  serverId: number;
}

export function SecurityStats({ stats, serverId }: SecurityStatsProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();
  const [isBackfilling, setIsBackfilling] = useState(stats.isBackfillRunning);

  const totalUnresolved = Object.values(stats.unresolvedAnomalies).reduce(
    (a, b) => a + b,
    0,
  );

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const result = await triggerGeolocationBackfill(serverId);
      if (!result.success && !result.alreadyRunning) {
        console.error("Failed to start backfill:", result.error);
      }
      setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start backfill:", error);
      setIsBackfilling(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueCountries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueCities}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.usersWithFingerprints}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Open Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUnresolved}</p>
            {totalUnresolved > 0 && (
              <div className="flex gap-1 mt-1">
                {stats.unresolvedAnomalies.critical && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.unresolvedAnomalies.critical} critical
                  </Badge>
                )}
                {stats.unresolvedAnomalies.high && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.unresolvedAnomalies.high} high
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.pendingActivities > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>
                {stats.pendingActivities} activities pending geolocation
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackfill}
              disabled={isBackfilling || stats.isBackfillRunning}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isBackfilling || stats.isBackfillRunning ? "animate-spin" : ""
                }`}
              />
              {stats.isBackfillRunning
                ? "Job Running..."
                : isBackfilling
                  ? "Starting..."
                  : "Run Backfill"}
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
