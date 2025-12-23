"use client";

import { AlertCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnomalyBadgeProps {
  count: number;
  severity?: "low" | "medium" | "high" | "critical";
  showTooltip?: boolean;
}

const severityConfig = {
  low: {
    variant: "secondary" as const,
    icon: Info,
    label: "Low",
    color: "text-blue-500",
  },
  medium: {
    variant: "outline" as const,
    icon: AlertCircle,
    label: "Medium",
    color: "text-yellow-500",
  },
  high: {
    variant: "destructive" as const,
    icon: AlertTriangle,
    label: "High",
    color: "text-orange-500",
  },
  critical: {
    variant: "destructive" as const,
    icon: ShieldAlert,
    label: "Critical",
    color: "text-red-500",
  },
};

export function AnomalyBadge({
  count,
  severity,
  showTooltip = true,
}: AnomalyBadgeProps) {
  if (count === 0) return null;

  const config = severity ? severityConfig[severity] : severityConfig.medium;
  const Icon = config.icon;

  const badge = (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {count}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>
            {count} unresolved {severity ? config.label.toLowerCase() : ""}{" "}
            anomal{count === 1 ? "y" : "ies"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AnomalySeverityBadgeProps {
  severity: "low" | "medium" | "high" | "critical";
}

export function AnomalySeverityBadge({ severity }: AnomalySeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={"h-3 w-3"} />
      {config.label}
    </Badge>
  );
}

interface AnomalyTypeBadgeProps {
  type: string;
}

const anomalyTypeLabels: Record<string, string> = {
  impossible_travel: "Impossible Travel",
  new_country: "New Country",
  new_device: "New Device",
  concurrent_streams: "Concurrent Streams",
  new_location: "New Location",
};

export function AnomalyTypeBadge({ type }: AnomalyTypeBadgeProps) {
  const label = anomalyTypeLabels[type] || type;

  return <Badge variant="outline">{label}</Badge>;
}
