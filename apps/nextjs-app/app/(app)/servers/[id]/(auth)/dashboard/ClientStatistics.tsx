"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientStatisticsResponse } from "@/lib/db/client-statistics";
import { ClientBreakdownCard } from "./ClientBreakdownCard";
import { ClientsPerDeviceCard } from "./ClientsPerDeviceCard";
import { ClientsPerUserCard } from "./ClientsPerUserCard";
import { ClientTranscodingCard } from "./ClientTranscodingCard";
import { ClientUsageCard } from "./ClientUsageCard";
import { MostPopularClientsCard } from "./MostPopularClientsCard";

export const ClientStatistics = ({
  data,
}: {
  data: ClientStatisticsResponse;
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sessions</CardTitle>
            <CardDescription>All client sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unique Clients</CardTitle>
            <CardDescription>Different client applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.uniqueClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unique Users</CardTitle>
            <CardDescription>Users using clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unique Devices</CardTitle>
            <CardDescription>Different devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.uniqueDevices}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClientBreakdownCard data={data.clientBreakdown} />
        <ClientUsageCard data={data.clientBreakdown} />
        <MostPopularClientsCard data={data.mostPopularClients} />
        <ClientTranscodingCard data={data.transcodingByClient} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ClientsPerUserCard data={data.clientsPerUser} />
        <ClientsPerDeviceCard data={data.clientsPerDevice} />
      </div>
    </div>
  );
};
