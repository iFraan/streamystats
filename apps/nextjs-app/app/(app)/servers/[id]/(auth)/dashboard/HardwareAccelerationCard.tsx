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
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryStat } from "@/lib/db/transcoding-statistics";

type Props = {
  data: CategoryStat[];
};

export const HardwareAccelerationCard = ({ data }: Props) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  const hwAccelData = data
    .map((item) => ({
      name: item.label,
      count: item.count,
    }))
    .filter((item) => item.count > 0);

  const hwAccelConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-1))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  if (hwAccelData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Acceleration</CardTitle>
          <CardDescription>
            Acceleration types used for transcoding
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">
            No hardware acceleration data to display
          </p>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4" />
            Primary acceleration: None
          </div>
        </CardFooter>
      </Card>
    );
  }

  const total = hwAccelData.reduce((sum, item) => sum + item.count, 0);
  const hwAccelDataWithPercent = hwAccelData.map((item) => ({
    ...item,
    labelWithPercent: `${item.name} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  const mostCommonAcceleration =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.count > current.count ? prev : current,
        )
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hardware Acceleration</CardTitle>
        <CardDescription>
          Acceleration types used for transcoding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="hardware-acceleration"
          config={hwAccelConfig}
          className="h-[200px]"
          onWidthChange={setContainerWidth}
        >
          <BarChart
            accessibilityLayer
            data={hwAccelDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(hwAccelData.length)}
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
          <ZapIcon className="h-4 w-4" />
          Primary acceleration:{" "}
          {mostCommonAcceleration ? mostCommonAcceleration.label : "None"}
        </div>
      </CardFooter>
    </Card>
  );
};
