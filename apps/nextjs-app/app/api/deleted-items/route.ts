import { db, items, type Server, servers } from "@streamystats/database";
import { and, count, desc, eq, gte, ilike, isNotNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api-auth";
import { getServer } from "@/lib/db/server";

/**
 * API Route: GET /api/deleted-items?serverId=123 OR ?serverName=MyServer
 *
 * Returns items that have been soft-deleted (removed from Jellyfin).
 * Requires valid API key in Authorization header that matches the target server.
 *
 * Query Params:
 *   - serverId: string (optional*) - The ID of the server to fetch deleted items for.
 *   - serverName: string (optional*) - The name of the server (case-insensitive match).
 *   * At least one of serverId or serverName is required.
 *   - since: string (optional) - ISO 8601 timestamp to filter items deleted after this time.
 *   - type: string (optional) - Filter by item type (Movie, Series, Episode, etc.)
 *   - libraryId: string (optional) - Filter by library ID.
 *   - limit: number (optional) - Maximum number of items to return (default: 100, max: 1000).
 *   - offset: number (optional) - Number of items to skip for pagination (default: 0).
 *
 * Headers:
 *   - Authorization: string (required) - API key in format "Bearer <key>" or just "<key>"
 *
 * Responses:
 *   - 200: Returns the deleted items as JSON.
 *   - 400: If neither serverId nor serverName is provided.
 *   - 401: If API key is invalid or missing.
 *   - 404: If server not found.
 *   - 500: On server error.
 */

/**
 * Find a server by name (case-insensitive)
 */
async function getServerByName(name: string): Promise<Server | undefined> {
  const result = await db
    .select()
    .from(servers)
    .where(ilike(servers.name, name))
    .limit(1);
  return result[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const serverName = searchParams.get("serverName");
  const since = searchParams.get("since");
  const type = searchParams.get("type");
  const libraryId = searchParams.get("libraryId");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  try {
    // Validate required parameters - need at least one of serverId or serverName
    if (!serverId && !serverName) {
      return new Response(
        JSON.stringify({
          error:
            "Either 'serverId' or 'serverName' query parameter is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Look up server by ID or name
    let server: Server | undefined;
    if (serverId) {
      server = await getServer({ serverId });
    } else if (serverName) {
      server = await getServerByName(serverName);
    }

    if (!server) {
      return new Response(
        JSON.stringify({
          error: "Server not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate API key against the specified server
    const authError = await requireApiKey({
      request,
      server,
    });

    if (authError) {
      return authError;
    }

    // Parse pagination params
    const limit = Math.min(
      Math.max(Number.parseInt(limitParam || "100", 10), 1),
      1000,
    );
    const offset = Math.max(Number.parseInt(offsetParam || "0", 10), 0);

    // Build query conditions
    const conditions = [
      eq(items.serverId, server.id),
      isNotNull(items.deletedAt),
    ];

    // Add optional filters
    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return new Response(
          JSON.stringify({
            error:
              "Invalid 'since' parameter. Must be a valid ISO 8601 timestamp.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      conditions.push(gte(items.deletedAt, sinceDate));
    }

    if (type) {
      conditions.push(eq(items.type, type));
    }

    if (libraryId) {
      conditions.push(eq(items.libraryId, libraryId));
    }

    // Fetch deleted items
    const deletedItems = await db
      .select({
        id: items.id,
        name: items.name,
        type: items.type,
        libraryId: items.libraryId,
        seriesName: items.seriesName,
        seasonName: items.seasonName,
        indexNumber: items.indexNumber,
        parentIndexNumber: items.parentIndexNumber,
        productionYear: items.productionYear,
        providerIds: items.providerIds,
        deletedAt: items.deletedAt,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .where(and(...conditions))
      .orderBy(desc(items.deletedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(items)
      .where(and(...conditions));

    const totalCount = totalCountResult[0]?.count ?? 0;

    return new Response(
      JSON.stringify({
        data: deletedItems,
        pagination: {
          limit,
          offset,
          totalCount,
          hasMore: offset + deletedItems.length < totalCount,
        },
        server: {
          id: server.id,
          name: server.name,
        },
        filters: {
          since: since || null,
          type: type || null,
          libraryId: libraryId || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching deleted items:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch deleted items",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
