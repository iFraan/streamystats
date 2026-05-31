import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { PageTitle } from "@/components/PageTitle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getServer } from "@/lib/db/server";
import { getSimilarityExplorerItems } from "@/lib/db/similarity-explorer";
import { getMe, getUsers, getViewerUserId, isUserAdmin } from "@/lib/db/users";
import { SimilarityExplorerTable } from "./SimilarityExplorerTable";
import {
  normalizeSimilarityExplorerParams,
  resolveSimilarityExplorerUserId,
  type SimilarityExplorerSearchParams,
} from "./similarity-explorer";

export default async function SimilarityExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SimilarityExplorerSearchParams>;
}) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const [server, me, isAdmin, viewerUserId] = await Promise.all([
    getServer({ serverId: id }),
    getMe(),
    isUserAdmin(),
    getViewerUserId(),
  ]);

  if (!server) {
    redirect("/not-found");
  }
  if (!me) {
    redirect(`/servers/${id}/login`);
  }

  const explorerParams = normalizeSimilarityExplorerParams(rawSearchParams);
  const users = await getUsers({ serverId: server.id });
  const selectedUserId = resolveSimilarityExplorerUserId({
    currentUserId: me.id,
    isAdmin,
    requestedUserId: explorerParams.requestedUserId,
    serverUserIds: users.map((user) => user.id),
  });
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const data = await getSimilarityExplorerItems({
    serverId: server.id,
    userId: selectedUserId,
    viewerUserId,
    page: explorerParams.page,
    search: explorerParams.search,
    sortOrder: explorerParams.sortOrder,
    type: explorerParams.type,
    watched: explorerParams.watched,
  });

  return (
    <Container>
      <PageTitle
        title="Similarity Explorer"
        subtitle={`Movies and series ranked against ${selectedUser?.name ?? me.name}'s taste profile.`}
      />
      {data.status === "missing-profile" ? (
        <Alert>
          <Sparkles />
          <AlertTitle>Taste profile not generated</AlertTitle>
          <AlertDescription>
            Generate user embeddings before exploring similarity rankings for
            this user.
          </AlertDescription>
        </Alert>
      ) : !data.hasEmbeddedItems ? (
        <Alert>
          <Sparkles />
          <AlertTitle>No embedded items</AlertTitle>
          <AlertDescription>
            Generate movie and series embeddings before exploring similarity
            rankings.
          </AlertDescription>
        </Alert>
      ) : (
        <SimilarityExplorerTable
          data={data}
          selectedUserId={selectedUserId}
          server={server}
          showUserFilter={isAdmin}
          users={users}
        />
      )}
    </Container>
  );
}
