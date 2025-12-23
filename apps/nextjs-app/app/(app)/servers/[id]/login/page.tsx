import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getServer, getServers } from "@/lib/db/server";
import { SignInForm } from "./SignInForm";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent id={id} />
    </Suspense>
  );
}

async function LoginContent({ id }: { id: string }) {
  const server = await getServer({ serverId: id });
  const servers = await getServers();

  if (!server) {
    redirect("/not-found");
  }

  return <SignInForm server={server} servers={servers} />;
}

function LoginSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto lg:min-w-[400px] space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
