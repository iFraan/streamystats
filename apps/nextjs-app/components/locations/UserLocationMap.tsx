"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

export interface LocationUser {
  userId: string;
  userName: string | null;
  activityCount: number;
  lastSeen: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  countryCode: string | null;
  country: string | null;
  city: string | null;
  activityCount: number;
  lastSeen: string;
  userId?: string | null;
  userName?: string | null;
  users?: LocationUser[];
}

interface UserLocationMapProps {
  locations: LocationPoint[];
  height?: string;
  showLegend?: boolean;
  mapKey?: string;
}

export function UserLocationMap({
  locations,
  height = "400px",
  showLegend = true,
  mapKey,
}: UserLocationMapProps) {
  // Filter out locations without coordinates
  const validLocations = locations.filter(
    (loc) => loc.latitude != null && loc.longitude != null,
  );

  if (validLocations.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/50 rounded-lg"
        style={{ height }}
      >
        <p className="text-muted-foreground">No location data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <MapWithNoSSR
        locations={validLocations}
        showLegend={showLegend}
        mapKey={mapKey}
      />
    </div>
  );
}
