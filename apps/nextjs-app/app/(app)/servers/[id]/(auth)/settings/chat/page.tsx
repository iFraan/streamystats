"use server";

import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { getServer } from "@/lib/db/server";
import { ChatAIManager } from "./ChatAIManager";

export default async function ChatAISettings(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const server = await getServer({ serverId: id });

  if (!server) {
    redirect("/setup");
  }

  return (
    <Container className="flex flex-col">
      <h1 className="text-3xl font-bold mb-8">AI Chat Settings</h1>

      <div className="space-y-8">
        <ChatAIManager server={server} />
      </div>
    </Container>
  );
}
