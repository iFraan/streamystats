"use client";

import { InfoIcon } from "lucide-react";
import { useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { CustomBarLabel } from "@/components/ui/CustomBarLabel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryStat } from "@/lib/db/transcoding-statistics";

interface TranscodingReasonsCardProps {
  data: CategoryStat[];
}

// Helper function to clean up reason labels
function cleanReasonLabel(label: string): string {
  // Handle stringified JSON arrays like "[\"ContainerNotSupported\"]"
  if (label.startsWith("[") && label.endsWith("]")) {
    try {
      const parsed = JSON.parse(label);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
    } catch (_error) {
      // If parsing fails, return the original label
    }
  }

  // Return the label as-is if it's not a JSON array
  return label;
}

export const TranscodingReasonsCard = ({
  data,
}: TranscodingReasonsCardProps) => {
  const reasonsData = data
    .map((item) => ({
      reason: cleanReasonLabel(item.label), // Use label instead of value, and clean it
      count: item.count,
    }))
    .filter((item) => item.count > 0);

  const reasonsConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-2))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  // Calculate bar height based on number of items
  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 38;
    const maxHeightPerBar = 56;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  const getChartHeight = (dataLength: number) => {
    const minHeight = 240;
    const maxHeight = 420;
    const heightPerBar = 48;
    return Math.min(Math.max(minHeight, dataLength * heightPerBar), maxHeight);
  };

  const total = reasonsData.reduce((sum, item) => sum + item.count, 0);
  const reasonsDataWithPercent = reasonsData.map((item) => ({
    ...item,
    labelWithPercent: `${item.reason} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  const renderBarLabel = useCallback(
    ({
      x,
      y,
      width,
      height,
      value,
    }: {
      x?: number | string;
      y?: number | string;
      width?: number | string;
      height?: number | string;
      value?: unknown;
    }) => (
      <CustomBarLabel
        x={Number(x)}
        y={Number(y)}
        width={Number(width)}
        height={Number(height)}
        value={
          typeof value === "string" || typeof value === "number"
            ? value
            : undefined
        }
        fill="#d6e3ff"
        fontSize={12}
        containerWidth={400}
        alwaysOutside
      />
    ),
    [],
  );

  // Find the most common reason (highest count)
  const mostCommonReason =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.count > current.count ? prev : current,
        )
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcoding Reasons</CardTitle>
        <CardDescription>Why media is being transcoded</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="transcoding-reasons"
          config={reasonsConfig}
          className="w-full aspect-auto"
          style={{ height: getChartHeight(reasonsDataWithPercent.length) }}
        >
          <BarChart
            accessibilityLayer
            data={reasonsDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(reasonsDataWithPercent.length)}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="reason"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="count"
              layout="vertical"
              radius={4}
              className="fill-blue-600"
            >
              <LabelList dataKey="labelWithPercent" content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4" />
          Most common reason:{" "}
          {mostCommonReason ? cleanReasonLabel(mostCommonReason.label) : "N/A"}
        </div>
      </CardFooter>
    </Card>
  );
};
