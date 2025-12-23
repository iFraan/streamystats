"use client";

import { ZapIcon } from "lucide-react";
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
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { NumericStat } from "@/lib/db/transcoding-statistics";

interface BitrateDistributionCardProps {
  data: NumericStat;
}

interface BitrateRange {
  range: string;
  count: number;
}

interface BitrateRangeWithPercent extends BitrateRange {
  labelWithPercent: string;
}

export const BitrateDistributionCard = ({
  data,
}: BitrateDistributionCardProps) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const formatBitrate = (value: number | null) => {
    if (value === null) return "0 Mbps";
    return `${(value / 1000000).toFixed(1)} Mbps`;
  };

  // Create bitrate ranges from the raw distribution data
  const createBitrateRanges = (values: number[]): BitrateRange[] => {
    if (!values || values.length === 0) return [];

    // Define bitrate ranges (inclusive, non-overlapping)
    const ranges = [
      { label: "0-0.5 Mbps", min: 0, max: 500000 },
      { label: "0.5-1 Mbps", min: 500001, max: 1000000 },
      { label: "1-2 Mbps", min: 1000001, max: 2000000 },
      { label: "2-4 Mbps", min: 2000001, max: 4000000 },
      { label: "4-6 Mbps", min: 4000001, max: 6000000 },
      { label: "6-8 Mbps", min: 6000001, max: 8000000 },
      { label: "8+ Mbps", min: 8000001, max: Number.POSITIVE_INFINITY },
    ];

    return ranges
      .map((range) => {
        const valuesInRange = values.filter(
          (b) => b >= range.min && b <= range.max,
        );
        return {
          range: range.label,
          count: valuesInRange.length,
        };
      })
      .filter((item) => item.count > 0);
  };

  // Use the distribution array from the NumericStat to create ranges
  const bitrateData = createBitrateRanges(data.distribution || []);

  const bitrateConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-3))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  const getBarHeight = (dataLength: number) => {
    // Adjust for a fixed number of categories, to keep bar sizes consistent
    const fixedLength = Math.max(dataLength, 3); // Use at least 3 as divisor
    const minHeightPerBar = 25;
    const maxHeightPerBar = 35;
    return Math.min(
      Math.max(minHeightPerBar, 200 / fixedLength),
      maxHeightPerBar,
    );
  };

  // Find categories with data for the footer
  const categoriesWithData = [...bitrateData].sort((a, b) => b.count - a.count);

  const mostCommonCategory =
    categoriesWithData.length > 0 ? categoriesWithData[0].range : "N/A";

  const total = bitrateData.reduce((sum, item) => sum + item.count, 0);
  const bitrateDataWithPercent: BitrateRangeWithPercent[] = bitrateData.map(
    (item) => ({
      ...item,
      labelWithPercent: `${item.range} - ${
        total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
      }%`,
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bitrate Distribution</CardTitle>
        <CardDescription>
          Avg: {formatBitrate(data.avg ?? 0)} | Min:{" "}
          {formatBitrate(data.min ?? 0)} | Max: {formatBitrate(data.max ?? 0)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bitrateData.length > 0 ? (
          <ChartContainer
            id="bitrate-distribution"
            config={bitrateConfig}
            className="h-[200px]"
            onWidthChange={setContainerWidth}
          >
            <BarChart
              accessibilityLayer
              data={bitrateDataWithPercent}
              layout="vertical"
              margin={{
                right: 16,
                left: 0,
                top: 5,
                bottom: 5,
              }}
              barSize={getBarHeight(bitrateData.length)}
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
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center text-muted-foreground">
              No bitrate data available
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-4 w-4" />
          {bitrateData.length > 0 ? (
            <>Most common: {mostCommonCategory}</>
          ) : (
            <>Data from {data.count} sessions</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
