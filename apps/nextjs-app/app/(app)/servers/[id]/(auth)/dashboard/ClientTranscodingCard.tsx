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
import type { ClientTranscodingStat } from "@/lib/db/client-statistics";

interface ClientTranscodingCardProps {
  data: ClientTranscodingStat[];
}

export const ClientTranscodingCard = ({ data }: ClientTranscodingCardProps) => {
  const [containerWidth, setContainerWidth] = React.useState(400);

  const transcodingData = data
    .map((item) => ({
      name: item.clientName || "Unknown",
      transcodingRate: Number(item.transcodingRate.toFixed(1)),
      transcoded: item.transcodedSessions,
      directPlay: item.directPlaySessions,
    }))
    .filter((item) => item.transcoded > 0 || item.directPlay > 0)
    .sort((a, b) => b.transcodingRate - a.transcodingRate)
    .slice(0, 10); // Top 10

  const transcodingConfig = {
    transcodingRate: {
      label: "Transcoding Rate (%)",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const transcodingDataWithLabel = transcodingData.map((item) => ({
    ...item,
    labelWithPercent: `${item.name} - ${item.transcodingRate}%`,
  }));

  const getBarHeight = (dataLength: number) => {
    const minHeightPerBar = 30;
    const maxHeightPerBar = 40;
    return Math.min(
      Math.max(minHeightPerBar, 200 / dataLength),
      maxHeightPerBar,
    );
  };

  if (transcodingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcoding by Client</CardTitle>
          <CardDescription>Transcoding rate per client</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-muted-foreground">
            No transcoding data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcoding by Client</CardTitle>
        <CardDescription>Transcoding rate per client</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          id="client-transcoding"
          config={transcodingConfig}
          className="h-[200px]"
          onWidthChange={setContainerWidth}
        >
          <BarChart
            accessibilityLayer
            data={transcodingDataWithLabel}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
              top: 5,
              bottom: 5,
            }}
            barSize={getBarHeight(transcodingData.length)}
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
            <XAxis dataKey="transcodingRate" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="transcodingRate"
              layout="vertical"
              radius={4}
              className="fill-orange-600"
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
          Showing clients with transcoding data
        </div>
      </CardFooter>
    </Card>
  );
};
