import { db, sessions } from "@streamystats/database";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getServer } from "@/lib/db/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    // Require admin for data export
    const { error } = await requireAdmin();
    if (error) return error;

    const { serverId } = await params;

    const server = await getServer({ serverId });
    if (!server) {
      return new Response(JSON.stringify({ error: "Server not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Export all session and related data for this server
    console.log(`Starting export for server ${server.id} (${server.name})`);

    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        serverName: server.name,
        serverId: server.id,
        version: "streamystats-v2",
        exportType: "sessions-only",
      },

      // Core session data - all sessions for this server
      sessions: await db.query.sessions.findMany({
        where: eq(sessions.serverId, Number(serverId)),
      }),

      // Server info
      server: {
        id: server.id,
        name: server.name,
        url: server.url,
        version: server.version,
      },
    };

    const sessionCount = exportData.sessions.length;

    console.log(
      `Export completed for server ${server.name}: ${sessionCount} sessions`,
    );

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `streamystats-backup-${server.name.replace(
      /[^a-zA-Z0-9]/g,
      "-",
    )}-${timestamp}.json`;

    // Return JSON response with proper headers for download
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": sessionCount.toString(),
        "X-Export-Server": server.name,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({
        error: "Export failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
