import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/Container";
import { getServerLocationStats } from "@/lib/db/locations";
import { getServer } from "@/lib/db/server";
import { getUsers, isUserAdmin } from "@/lib/db/users";
import { SecurityFilters } from "./_components/SecurityFilters";
import { SecurityHeader } from "./_components/SecurityHeader";
import { SecurityStats } from "./_components/SecurityStats";
import { SecurityTabs } from "./_components/SecurityTabs";

export default async function SecurityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [server, isAdmin] = await Promise.all([
    getServer({ serverId: id }),
    isUserAdmin(),
  ]);

  if (!server) {
    redirect("/");
  }

  if (!isAdmin) {
    redirect(`/servers/${id}/dashboard`);
  }

  const [stats, users] = await Promise.all([
    getServerLocationStats(server.id),
    getUsers({ serverId: server.id }),
  ]);

  return (
    <Container className="flex flex-col">
      <SecurityHeader serverId={server.id} />
      <div className="space-y-6">
        <SecurityStats stats={stats} serverId={server.id} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SecurityTabs stats={stats} />
          <SecurityFilters
            users={users.map((u) => ({ id: u.id, name: u.name }))}
          />
        </div>
        <Suspense
          fallback={
            <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
          }
        >
          {children}
        </Suspense>
      </div>
    </Container>
  );
}
