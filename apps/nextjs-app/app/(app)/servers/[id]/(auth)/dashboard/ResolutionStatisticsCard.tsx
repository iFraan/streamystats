"use client";

import { InfoIcon } from "lucide-react";
import React from "react";
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
import type { NumericStat } from "@/lib/db/transcoding-statistics";

interface Props {
  width: NumericStat;
  height: NumericStat;
}

// Helper function to categorize resolution by width
function categorizeResolution(width: number): string {
  // Common resolution categories based on width
  if (width >= 3840) return "4K (3840+)";
  if (width >= 2560) return "1440p (2560+)";
  if (width >= 1920) return "1080p (1920)";
  if (width >= 1280) return "720p (1280)";
  if (width >= 960) return "SD+ (960+)";
  if (width >= 720) return "SD (720+)";
  return "Low (<720)";
}

// Helper function to process raw distribution data into ranges
function processResolutionDistribution(
  widthDist: number[],
  heightDist: number[],
) {
  const ranges: { [key: string]: number } = {};

  // Ensure both arrays have the same length
  const minLength = Math.min(widthDist.length, heightDist.length);

  for (let i = 0; i < minLength; i++) {
    const width = widthDist[i];
    const category = categorizeResolution(width);

    ranges[category] = (ranges[category] || 0) + 1;
  }

  // Convert to array format and sort by count
  return Object.entries(ranges)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => b.count - a.count);
}

export const ResolutionStatisticsCard = ({ width, height }: Props) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  // Process the raw distribution data into resolution ranges
  const resolutionWidthData = React.useMemo(() => {
    if (!width.distribution || !height.distribution) {
      return [];
    }

    return processResolutionDistribution(
      width.distribution,
      height.distribution,
    ).filter((d) => d.count > 0);
  }, [width.distribution, height.distribution]);

  const resolutionConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-5))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  const total = resolutionWidthData.reduce((sum, item) => sum + item.count, 0);

  const resolutionDataWithPercent = resolutionWidthData.map((item) => ({
    ...item,
    labelWithPercent: `${item.range} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  // Handle cases where there's no data
  if (resolutionWidthData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolution Statistics</CardTitle>
          <CardDescription>
            {width.avg && height.avg
              ? `Avg: ${width.avg?.toFixed(0)}×${height.avg?.toFixed(0)}`
              : "No resolution data available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">
            No resolution data to display
          </p>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            Most common: N/A
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution Statistics</CardTitle>
        <CardDescription>
          Avg: {width.avg?.toFixed(0)}×{height.avg?.toFixed(0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="resolution-stats"
          config={resolutionConfig}
          className="h-[200px]"
          onWidthChange={setContainerWidth}
        >
          <BarChart
            accessibilityLayer
            data={resolutionDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(resolutionWidthData.length)}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="range"
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
              <LabelList
                dataKey="labelWithPercent"
                content={({ x, y, width: barWidth, height, value }) => (
                  <CustomBarLabel
                    x={Number(x)}
                    y={Number(y)}
                    width={Number(barWidth)}
                    height={Number(height)}
                    value={value}
                    fill="#d6e3ff"
                    fontSize={12}
                    containerWidth={containerWidth}
                    alwaysOutside
                  />
                )}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4" />
          Most common: {resolutionWidthData[0]?.range || "N/A"}
        </div>
      </CardFooter>
    </Card>
  );
};
