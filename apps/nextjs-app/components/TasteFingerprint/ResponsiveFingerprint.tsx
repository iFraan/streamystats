"use client";

import { useEffect, useState } from "react";
import type { TasteProfile } from "@/lib/db/taste-profile";
import { TasteFingerprint } from "./TasteFingerprint";

interface ResponsiveFingerprintProps {
  profile: TasteProfile;
  animated?: boolean;
  showControls?: boolean;
}

// Scale inner content based on watch time
// 1 day (86400s) = minimum, 365 days (31536000s) = maximum
const MIN_WATCH_TIME = 86400; // 1 day in seconds
const MAX_WATCH_TIME = 31536000; // 365 days in seconds
const MIN_SCALE = 0.4; // 40% inner content at minimum watch time
const MAX_SCALE = 1.0; // 100% inner content at maximum watch time

function getWatchTimeScale(totalWatchTime: number): number {
  const clampedTime = Math.max(
    MIN_WATCH_TIME,
    Math.min(MAX_WATCH_TIME, totalWatchTime),
  );

  // Use square root for smoother scaling
  const minSqrt = Math.sqrt(MIN_WATCH_TIME);
  const maxSqrt = Math.sqrt(MAX_WATCH_TIME);
  const timeSqrt = Math.sqrt(clampedTime);

  const ratio = (timeSqrt - minSqrt) / (maxSqrt - minSqrt);
  return MIN_SCALE + ratio * (MAX_SCALE - MIN_SCALE);
}

export function ResponsiveFingerprint({
  profile,
  animated = true,
  showControls = true,
}: ResponsiveFingerprintProps) {
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCanvasSize(Math.min(360, width - 40));
      } else if (width < 1024) {
        setCanvasSize(450);
      } else if (width < 1280) {
        setCanvasSize(420);
      } else {
        setCanvasSize(500);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Inner content scale based on watch time (constellation stays fixed)
  const contentScale = getWatchTimeScale(profile.totalWatchTime);

  return (
    <TasteFingerprint
      profile={profile}
      size={canvasSize}
      contentScale={contentScale}
      animated={animated}
      showControls={showControls}
    />
  );
}
