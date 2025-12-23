"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationPoint } from "./UserLocationMap";

// Fix for default marker icons in webpack/next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom marker colors based on activity count
function getMarkerIcon(activityCount: number): L.DivIcon {
  let color = "#3b82f6"; // blue - default
  let size = 24;

  if (activityCount >= 50) {
    color = "#22c55e"; // green - frequent
    size = 32;
  } else if (activityCount >= 10) {
    color = "#eab308"; // yellow - moderate
    size = 28;
  } else if (activityCount <= 2) {
    color = "#ef4444"; // red - rare (potential anomaly)
    size = 24;
  }

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">${activityCount > 99 ? "99+" : activityCount}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

interface FitBoundsComponentProps {
  locations: LocationPoint[];
}

function FitBoundsComponent({ locations }: FitBoundsComponentProps) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const bounds = L.latLngBounds(
      locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]),
    );

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }, [locations, map]);

  return null;
}

interface MapComponentProps {
  locations: LocationPoint[];
  showLegend?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Counter for generating unique stable IDs when mapKey is not provided
let mapIdCounter = 0;

export default function MapComponent({
  locations,
  showLegend = true,
  mapKey,
}: MapComponentProps & { mapKey?: string }) {
  // Generate a stable ID that persists across re-renders
  const stableIdRef = useRef<string | null>(null);
  if (stableIdRef.current === null) {
    stableIdRef.current = `map-${++mapIdCounter}`;
  }

  // Calculate center from locations
  const center: [number, number] = useMemo(() => {
    if (locations.length === 0) return [20, 0];
    return [
      locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length,
      locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length,
    ];
  }, [locations]);

  const containerId = mapKey
    ? `map-container-${mapKey}`
    : `map-container-${stableIdRef.current}`;

  return (
    <div className="relative h-full w-full" id={containerId}>
      <MapContainer
        key={mapKey || stableIdRef.current}
        center={center}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsComponent locations={locations} />

        {locations.map((location, index) => (
          <Marker
            key={`${location.latitude}-${location.longitude}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={getMarkerIcon(location.activityCount)}
          >
            <Popup>
              <div className="min-w-[220px] max-w-[280px]">
                <h3 className="font-semibold text-sm mb-2">
                  {location.city || location.country || "Unknown"}
                </h3>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="text-muted-foreground">Country:</span>{" "}
                    {location.country || "Unknown"}
                  </p>
                  {location.city && (
                    <p>
                      <span className="text-muted-foreground">City:</span>{" "}
                      {location.city}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">
                      Total Activities:
                    </span>{" "}
                    {location.activityCount}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last seen:</span>{" "}
                    {formatDate(location.lastSeen)}
                  </p>
                </div>

                {location.users && location.users.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs font-medium mb-2">
                      Users ({location.users.length})
                    </p>
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                      {location.users.map((user) => (
                        <div
                          key={user.userId}
                          className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded"
                        >
                          <span className="font-medium truncate max-w-[140px]">
                            {user.userName || `${user.userId.slice(0, 8)}...`}
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap ml-2">
                            {user.activityCount} activities
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!location.users && location.userName && (
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">User:</span>{" "}
                    {location.userName}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
          <p className="text-xs font-medium mb-2">Activity Frequency</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span>50+ activities</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-[#eab308]" />
              <span>10-49 activities</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span>3-9 activities</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span>1-2 activities</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

