import type { Server } from "@streamystats/database/schema";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/Container";
import { PageTitle } from "@/components/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeasonalRecommendations } from "@/lib/db/seasonal-recommendations";
import { getServer } from "@/lib/db/server";
import { getSimilarSeries } from "@/lib/db/similar-series-statistics";
import { getSimilarStatistics } from "@/lib/db/similar-statistics";
import { getMostWatchedItems } from "@/lib/db/statistics";
import { getMe, isUserAdmin } from "@/lib/db/users";
import { ActiveSessions } from "./ActiveSessions";
import { MostWatchedItems } from "./MostWatchedItems";
import { SeasonalRecommendations } from "./SeasonalRecommendations";
import { SimilarSeriesStatistics } from "./SimilarSeriesStatistics";
import { SimilarMovieStatistics } from "./SimilarStatistics";
import { UserActivityWrapper } from "./UserActivityWrapper";
import { UserLeaderboard } from "./UserLeaderboard";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    userActivityStartDate: string;
    userActivityEndDate: string;
  }>;
}) {
  const { id } = await params;
  const { userActivityStartDate, userActivityEndDate } = await searchParams;

  return (
    <Container className="relative flex flex-col">
      <Suspense fallback={<Skeleton className="h-48 w-full mb-8" />}>
        <DashboardContent
          serverId={id}
          userActivityStartDate={userActivityStartDate}
          userActivityEndDate={userActivityEndDate}
        />
      </Suspense>
    </Container>
  );
}

async function DashboardContent({
  serverId,
  userActivityStartDate,
  userActivityEndDate,
}: {
  serverId: string;
  userActivityStartDate: string;
  userActivityEndDate: string;
}) {
  const server = await getServer({ serverId });

  if (!server) {
    redirect("/not-found");
  }

  const isAdmin = await isUserAdmin();

  return (
    <>
      {isAdmin && (
        <div className="mb-8">
          <ActiveSessions server={server} />
        </div>
      )}
      <PageTitle title="Home" />
      <GeneralStats
        server={server}
        userActivityStartDate={userActivityStartDate}
        userActivityEndDate={userActivityEndDate}
      />
    </>
  );
}

async function GeneralStats({
  server,
  userActivityStartDate,
  userActivityEndDate,
}: {
  server: Server;
  userActivityStartDate: string;
  userActivityEndDate: string;
}) {
  const [me, isAdmin] = await Promise.all([getMe(), isUserAdmin()]);

  const [similarData, similarSeriesData, data, seasonalData] =
    await Promise.all([
      getSimilarStatistics(server.id),
      getSimilarSeries(server.id),
      getMostWatchedItems({
        serverId: server.id,
        userId: isAdmin ? undefined : me?.id,
      }),
      getSeasonalRecommendations(server.id),
    ]);

  return (
    <div className="flex flex-col gap-6">
      {/* <ServerSetupMonitor serverId={server.id} serverName={server.name} /> */}
      {seasonalData && (
        <SeasonalRecommendations data={seasonalData} server={server} />
      )}
      <SimilarMovieStatistics data={similarData} server={server} />
      <SimilarSeriesStatistics data={similarSeriesData} server={server} />
      <MostWatchedItems data={data} server={server} />
      {isAdmin ? (
        <>
          <UserLeaderboard server={server} />
          <UserActivityWrapper
            server={server}
            startDate={userActivityStartDate}
            endDate={userActivityEndDate}
          />
        </>
      ) : null}
    </div>
  );
}
