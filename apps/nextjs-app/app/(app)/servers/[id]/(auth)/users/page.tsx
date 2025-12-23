import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { PageTitle } from "@/components/PageTitle";
import { getServer } from "@/lib/db/server";
import { getUsersWithStats } from "@/lib/db/users";
import { UserTable } from "./UserTable";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const server = await getServer({ serverId: id });

  if (!server) {
    redirect("/");
  }

  const users = await getUsersWithStats({ serverId: server.id });

  return (
    <Container className="flex flex-col">
      <PageTitle title="Users" />
      <UserTable data={users} server={server} />
    </Container>
  );
}
