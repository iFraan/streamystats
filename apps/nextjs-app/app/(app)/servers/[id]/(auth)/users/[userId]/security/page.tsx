import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { PageTitle } from "@/components/PageTitle";
import { Badge } from "@/components/ui/badge";
import {
  getUserAnomalies,
  getUserFingerprint,
  getUserHourHistogram,
  getUserLocationHistory,
  getUserUniqueLocations,
} from "@/lib/db/locations";
import { getServer } from "@/lib/db/server";
import { getUserById } from "@/lib/db/users";
import { UserSecurityContent } from "./UserSecurityContent";

export default async function UserSecurityPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const server = await getServer({ serverId: id });

  if (!server) {
    redirect("/");
  }

  const user = await getUserById({ userId: userId, serverId: server.id });
  if (!user) {
    redirect("/");
  }

  // Calculate start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const [locations, locationHistory, fingerprint, anomalyData, weekHistogram] =
    await Promise.all([
      getUserUniqueLocations(server.id, user.id),
      getUserLocationHistory(server.id, user.id, 20),
      getUserFingerprint(server.id, user.id),
      getUserAnomalies(server.id, user.id),
      getUserHourHistogram(server.id, user.id, weekStart),
    ]);

  return (
    <Container className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <PageTitle title={`${user.name} - Security`} />
        {anomalyData.unresolvedCount > 0 && (
          <Badge variant="destructive">
            {anomalyData.unresolvedCount} unresolved anomal
            {anomalyData.unresolvedCount === 1 ? "y" : "ies"}
          </Badge>
        )}
      </div>

      <UserSecurityContent
        serverId={server.id}
        userId={user.id}
        locations={locations}
        locationHistory={locationHistory}
        fingerprint={fingerprint}
        anomalies={anomalyData.anomalies}
        unresolvedCount={anomalyData.unresolvedCount}
        weekHistogram={weekHistogram}
      />
    </Container>
  );
}
