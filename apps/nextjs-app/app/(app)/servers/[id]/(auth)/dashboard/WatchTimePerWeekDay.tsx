"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WatchTimePerWeekDay as IWatchTimePerWeekDay } from "@/lib/db/users";
import { formatDuration } from "@/lib/utils";

const chartConfig = {
  minutes: {
    label: "Minutes",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface Props {
  title: string;
  subtitle: string;
  data: IWatchTimePerWeekDay[];
}

const dayAbbreviations: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const WatchTimePerWeekDay: React.FC<Props> = ({
  title,
  subtitle,
  data,
}) => {
  const formattedData = React.useMemo(() => {
    if (!data) return [];

    return data.map((item) => ({
      day: dayAbbreviations[item.day] || item.day,
      minutes: Math.floor(item.watchTime / 60), // Convert seconds to minutes
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          id="watch-time-per-weekday"
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={formattedData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(m) => (
                    <div className="flex flex-row items-center justify-between w-full">
                      <p>{formatDuration(Number(m), "minutes")}</p>
                    </div>
                  )}
                  hideLabel
                />
              }
            />
            <Bar dataKey="minutes" fill="#2761D9" radius={8} name="Minutes" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
