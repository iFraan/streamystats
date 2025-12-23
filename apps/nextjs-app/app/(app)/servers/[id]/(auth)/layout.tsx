import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type PropsWithChildren, Suspense } from "react";
import { ChatDialogWrapper } from "@/components/ChatDialogWrapper";
import { DynamicBreadcrumbs } from "@/components/DynamicBreadcrumbs";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SideBar } from "@/components/SideBar";
import { SuspenseLoading } from "@/components/SuspenseLoading";
import { UpdateNotifier } from "@/components/UpdateNotifier";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getServer, getServers } from "@/lib/db/server";
import { getMe, isUserAdmin } from "@/lib/db/users";

interface Props extends PropsWithChildren {
  params: Promise<{ id: string }>;
}

async function SideBarContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [servers, me, isAdmin] = await Promise.all([
    getServers(),
    getMe(),
    isUserAdmin(),
  ]);

  if (!me) {
    redirect(`/servers/${id}/login`);
  }

  return (
    <>
      <SideBar servers={servers} me={me} allowedToCreateServer={isAdmin} />
      {isAdmin && <UpdateNotifier />}
    </>
  );
}

async function HeaderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [server, me] = await Promise.all([
    getServer({ serverId: id }),
    getMe(),
  ]);

  const chatConfigured = !!(server?.chatProvider && server?.chatModel);

  return (
    <div className="flex flex-row items-center p-4 gap-2 relative">
      <SidebarTrigger />
      <Separator orientation="vertical" />
      <DynamicBreadcrumbs />
      <div className="ml-auto">
        <ChatDialogWrapper
          chatConfigured={chatConfigured}
          me={me ?? undefined}
          serverUrl={server?.url}
        />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-row items-center p-4 gap-2 relative">
      <Skeleton className="h-8 w-8" />
      <Separator orientation="vertical" />
      <Skeleton className="h-4 w-48" />
      <div className="ml-auto">
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

function SideBarSkeleton() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <Skeleton className="h-full w-full" />
      </SidebarContent>
    </Sidebar>
  );
}

async function LayoutContent({ children, params }: Props) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Suspense fallback={<SideBarSkeleton />}>
        <SideBarContent params={params} />
      </Suspense>
      <SidebarInset className="min-w-0">
        <ErrorBoundary>
          <Suspense fallback={<HeaderSkeleton />}>
            <HeaderContent params={params} />
          </Suspense>
          <Suspense fallback={<SuspenseLoading />}>{children}</Suspense>
        </ErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  );
}

function LayoutSkeleton() {
  return (
    <SidebarProvider>
      <SideBarSkeleton />
      <SidebarInset className="min-w-0">
        <HeaderSkeleton />
        <SuspenseLoading />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function layout({ children, params }: Props) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <LayoutContent params={params}>{children}</LayoutContent>
    </Suspense>
  );
}
