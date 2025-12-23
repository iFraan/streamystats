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
import type { DirectnessStat } from "@/lib/db/transcoding-statistics";

interface DirectnessCardProps {
  data: DirectnessStat[];
}

export const DirectnessCard = ({ data }: DirectnessCardProps) => {
  const directnessConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-2))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  const directnessData = data
    .map((item) => ({
      name: item.label,
      count: item.count,
    }))
    .filter((item) => item.count > 0);

  const total = directnessData.reduce((sum, item) => sum + item.count, 0);
  const directnessDataWithPercent = directnessData.map((item) => ({
    ...item,
    percent: total > 0 ? (item.count / total) * 100 : 0,
    labelWithPercent: `${item.name} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  // Calculate bar height based on number of items
  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcoding Directness</CardTitle>
        <CardDescription>
          How often content plays directly vs transcoded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="directness"
          config={directnessConfig}
          className="h-[200px]"
        >
          <BarChart
            accessibilityLayer
            data={directnessDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(directnessData.length)}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
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
        {data.length > 0 ? (
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            {data[0]?.label}: {data[0]?.percentage?.toFixed(1)}%
          </div>
        ) : (
          <div>No transcoding data available</div>
        )}
      </CardFooter>
    </Card>
  );
};
