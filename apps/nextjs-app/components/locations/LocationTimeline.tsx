"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Activity, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LocationEntry {
  id: number;
  activityId?: string;
  ipAddress: string;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isPrivateIp: boolean;
  createdAt: string;
  activityType: string | null;
  activityName: string | null;
  activityDate: string | null;
}

interface LocationTimelineProps {
  locations: LocationEntry[];
  maxItems?: number;
}

export function LocationTimeline({
  locations,
  maxItems = 10,
}: LocationTimelineProps) {
  const displayLocations = locations.slice(0, maxItems);

  if (displayLocations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No location history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location History</CardTitle>
        <CardDescription>Recent activity locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {displayLocations.map((location, index) => (
              <div key={location.id} className="relative pl-10">
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                    location.isPrivateIp
                      ? "bg-muted"
                      : index === 0
                        ? "bg-primary"
                        : "bg-muted-foreground"
                  }`}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {location.isPrivateIp ? (
                      <span className="font-medium">Private Network</span>
                    ) : (
                      <span className="font-medium">
                        {location.city ||
                          location.country ||
                          "Unknown Location"}
                        {location.city && location.country && (
                          <span className="text-muted-foreground font-normal">
                            , {location.country}
                          </span>
                        )}
                      </span>
                    )}
                    {location.isPrivateIp && (
                      <Badge variant="secondary" className="text-xs">
                        Local
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {location.activityType && (
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {location.activityType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {location.activityDate ? (
                      <>
                        {format(new Date(location.activityDate), "PPp")}
                        <span className="text-muted-foreground/60">
                          (
                          {formatDistanceToNow(
                            new Date(location.activityDate),
                            {
                              addSuffix: true,
                            },
                          )}
                          )
                        </span>
                      </>
                    ) : (
                      formatDistanceToNow(new Date(location.createdAt), {
                        addSuffix: true,
                      })
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {locations.length > maxItems && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Showing {maxItems} of {locations.length} locations
          </p>
        )}
      </CardContent>
    </Card>
  );
}
