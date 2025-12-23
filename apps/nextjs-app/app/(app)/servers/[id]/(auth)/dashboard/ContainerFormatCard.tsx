"use client";

import { Layers } from "lucide-react";
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

interface ContainerFormatCardProps {
  data: CategoryStat[];
}

export const ContainerFormatCard = ({ data }: ContainerFormatCardProps) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const containerData = data
    .map((item) => ({
      name: item.label,
      count: item.count,
    }))
    .filter((item) => item.count > 0);

  const containerConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--chart-5))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig;

  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  const total = containerData.reduce((sum, item) => sum + item.count, 0);
  const containerDataWithPercent = containerData.map((item) => ({
    ...item,
    labelWithPercent: `${item.name} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  const mostCommonContainer =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.count > current.count ? prev : current,
        )
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Container Format</CardTitle>
        <CardDescription>Media container distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="container-format"
          config={containerConfig}
          className="h-[200px]"
          onWidthChange={setContainerWidth}
        >
          <BarChart
            accessibilityLayer
            data={containerDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(containerData.length)}
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
          <Layers className="h-4 w-4" />
          Primary container:{" "}
          {mostCommonContainer ? mostCommonContainer.label : "N/A"}
        </div>
      </CardFooter>
    </Card>
  );
};
