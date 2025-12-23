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
import type { ClientStat } from "@/lib/db/client-statistics";

interface ClientBreakdownCardProps {
  data: ClientStat[];
}

export const ClientBreakdownCard = ({ data }: ClientBreakdownCardProps) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const clientData = data
    .map((item) => ({
      name: item.clientName || "Unknown",
      count: item.sessionCount,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  const clientConfig = {
    count: {
      label: "Sessions",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const total = clientData.reduce((sum, item) => sum + item.count, 0);
  const clientDataWithPercent = clientData.map((item) => ({
    ...item,
    percent: total > 0 ? (item.count / total) * 100 : 0,
    labelWithPercent: `${item.name} - ${
      total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0"
    }%`,
  }));

  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  if (clientData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Breakdown</CardTitle>
          <CardDescription>Distribution of clients by sessions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-muted-foreground">No client data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Breakdown</CardTitle>
        <CardDescription>Distribution of clients by sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="client-breakdown"
          config={clientConfig}
          className="h-[200px]"
          onWidthChange={setContainerWidth}
        >
          <BarChart
            accessibilityLayer
            data={clientDataWithPercent}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(clientData.length)}
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
          <InfoIcon className="h-4 w-4" />
          Showing top {clientData.length} clients
        </div>
      </CardFooter>
    </Card>
  );
};
