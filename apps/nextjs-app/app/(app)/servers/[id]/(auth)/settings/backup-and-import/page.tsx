"use server";

import { Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getServer } from "@/lib/db/server";
import DatabaseBackupRestore from "./DatabaseBackupRestore";
import JellystatsImport from "./JellystatsImport";
import PlaybackReportingImport from "./PlaybackReportingImport";

export default async function BackupAndImportSettings(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const server = await getServer({ serverId: id });

  if (!server) {
    redirect("/not-found");
  }

  const hasCompletedInitialSync = server.lastSyncCompleted !== null;

  return (
    <Container className="flex flex-col">
      <h1 className="text-3xl font-bold mb-8">Backup & Import Settings</h1>

      {!hasCompletedInitialSync && (
        <Alert
          variant="default"
          className="mb-8 border-amber-500/50 bg-amber-500/10"
        >
          <Clock className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">
            Initial Sync Required
          </AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            Please wait for the initial server sync to complete before importing
            data. This ensures users and items are available for matching
            imported sessions. Import functionality is disabled until the sync
            completes.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        <div>
          <JellystatsImport
            serverId={server.id}
            lastSyncCompleted={server.lastSyncCompleted}
          />
        </div>

        <div>
          <PlaybackReportingImport
            serverId={server.id}
            lastSyncCompleted={server.lastSyncCompleted}
          />
        </div>

        <hr className="my-8" />

        <div>
          <DatabaseBackupRestore
            serverId={server.id}
            lastSyncCompleted={server.lastSyncCompleted}
          />
        </div>
      </div>
    </Container>
  );
}
