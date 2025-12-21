import { Container } from "@/components/Container";
import { ServerJobStatusCard } from "@/components/ServerJobStatusCard";
import { getServer } from "@/lib/db/server";
import { isUserAdmin } from "@/lib/db/users";
import { redirect } from "next/navigation";
import { CleanupManager } from "../CleanupManager";
import { DangerousMergeManager } from "../DangerousMergeManager";
import { DangerousSeriesMergeManager } from "../DangerousSeriesMergeManager";
import { DeleteServer } from "../DeleteServer";
import { LibrarySyncManager } from "../LibrarySyncManager";
import { MergeItemsManager } from "../MergeItemsManager";
import { SyncManager } from "../SyncManager";
import { UpdateConnection } from "../UpdateConnection";
import { VersionSection } from "../VersionSection";

export default async function GeneralSettings(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const server = await getServer({ serverId: id });
  if (!server) {
    redirect("/setup");
  }
  const isAdmin = await isUserAdmin();

  return (
    <Container className="flex flex-col">
      <h1 className="text-3xl font-bold mb-8">General Settings</h1>

      <div className="space-y-8">
        <VersionSection />
        {isAdmin ? <ServerJobStatusCard serverId={server.id} /> : null}
        <UpdateConnection serverId={server.id} />
        <SyncManager serverId={server.id} serverName={server.name} />
        {isAdmin ? <LibrarySyncManager serverId={server.id} /> : null}
        {isAdmin ? <CleanupManager serverId={server.id} /> : null}
        {isAdmin ? <MergeItemsManager server={server} /> : null}
        {isAdmin ? <DangerousMergeManager server={server} /> : null}
        {isAdmin ? <DangerousSeriesMergeManager server={server} /> : null}
        <DeleteServer server={server} />
      </div>
    </Container>
  );
}
