import { redirect } from "next/navigation";
import { UserLocationMap } from "@/components/locations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerLocations } from "@/lib/db/locations";
import { getServer } from "@/lib/db/server";

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { id } = await params;
  const { userId, dateFrom, dateTo } = await searchParams;

  const server = await getServer({ serverId: id });
  if (!server) {
    redirect("/");
  }

  const locations = await getServerLocations(server.id, {
    userId,
    dateFrom,
    dateTo,
  });

  const hasFilters = !!(userId || dateFrom || dateTo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Locations</CardTitle>
        <CardDescription>
          Geographic distribution of all user sessions
          {hasFilters && " (filtered)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserLocationMap locations={locations} height="500px" />
      </CardContent>
    </Card>
  );
}
