"use client";

import { Fingerprint, Globe, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ActivityHeatmap,
  type LocationPoint,
  UserLocationMap,
} from "@/components/locations";
import { AnomalyList } from "@/components/locations/AnomalyList";
import { LocationTimeline } from "@/components/locations/LocationTimeline";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Anomaly,
  LocationEntry,
  UserFingerprint,
} from "@/lib/db/locations";
import { resolveAnomaly, unresolveAnomaly } from "@/lib/db/locations";

interface UserSecurityContentProps {
  serverId: number;
  userId: string;
  locations: LocationPoint[];
  locationHistory: LocationEntry[];
  fingerprint: UserFingerprint | null;
  anomalies: Anomaly[];
  unresolvedCount: number;
  weekHistogram: Record<number, number>;
}

export function UserSecurityContent({
  serverId,
  userId: _userId,
  locations,
  locationHistory,
  fingerprint,
  anomalies,
  unresolvedCount,
  weekHistogram,
}: UserSecurityContentProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  const handleResolve = async (anomalyId: number, note?: string) => {
    await resolveAnomaly(serverId, anomalyId, { resolutionNote: note });
    startTransition(() => {
      router.refresh();
    });
  };

  const handleUnresolve = async (anomalyId: number) => {
    await unresolveAnomaly(serverId, anomalyId);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="map">Location Map</TabsTrigger>
        <TabsTrigger value="history">Location History</TabsTrigger>
        <TabsTrigger value="anomalies" className="relative">
          Anomalies
          {unresolvedCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unresolvedCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Known Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {fingerprint?.knownCountries.length || locations.length || 0}
              </p>
              {fingerprint?.knownCountries &&
                fingerprint.knownCountries.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fingerprint.knownCountries.slice(0, 3).join(", ")}
                    {fingerprint.knownCountries.length > 3 && "..."}
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Known Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {fingerprint?.knownDeviceIds.length || 0}
              </p>
              {fingerprint?.devicePatterns &&
                fingerprint.devicePatterns.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fingerprint.devicePatterns
                      .slice(0, 2)
                      .map((d) => d.deviceName || d.deviceId)
                      .join(", ")}
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {fingerprint?.totalSessions || 0}
              </p>
              {fingerprint?.avgSessionsPerDay && (
                <p className="text-xs text-muted-foreground mt-1">
                  ~{fingerprint.avgSessionsPerDay.toFixed(1)} per day
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {locations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Overview</CardTitle>
              <CardDescription>
                Geographic distribution of sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserLocationMap
                locations={locations}
                height="300px"
                mapKey="overview-map"
              />
            </CardContent>
          </Card>
        )}

        <ActivityHeatmap
          allTimeHistogram={fingerprint?.hourHistogram || {}}
          weekHistogram={weekHistogram}
        />

        {fingerprint && fingerprint.knownClients.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Known Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {fingerprint.knownClients.map((client) => (
                  <Badge key={client} variant="secondary">
                    {client}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {anomalies.length > 0 && (
          <AnomalyList
            anomalies={anomalies.slice(0, 5)}
            showUserColumn={false}
            onResolve={handleResolve}
            onUnresolve={handleUnresolve}
          />
        )}
      </TabsContent>

      <TabsContent value="map">
        <Card>
          <CardHeader>
            <CardTitle>Session Locations</CardTitle>
            <CardDescription>
              All geolocated sessions for this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserLocationMap
              locations={locations}
              height="500px"
              mapKey="map-tab-map"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <LocationTimeline locations={locationHistory} maxItems={20} />
      </TabsContent>

      <TabsContent value="anomalies">
        <AnomalyList
          anomalies={anomalies}
          showUserColumn={false}
          onResolve={handleResolve}
          onUnresolve={handleUnresolve}
        />
      </TabsContent>
    </Tabs>
  );
}
