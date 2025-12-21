"use server";

import { db } from "@streamystats/database";
import { servers } from "@streamystats/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Server action to update excluded users for a server
 */
export async function updateExcludedUsersAction(
  serverId: number,
  excludedUserIds: string[],
) {
  try {
    await db
      .update(servers)
      .set({ excludedUserIds })
      .where(eq(servers.id, serverId));

    // Revalidate cache for exclusion settings
    revalidateTag(`exclusion-settings-${serverId}`);

    // Revalidate all statistics pages
    revalidatePath(`/servers/${serverId}/dashboard`);
    revalidatePath(`/servers/${serverId}/settings/exclusions`);
    revalidatePath(`/servers/${serverId}/library`);
    revalidatePath(`/servers/${serverId}/users`);
    revalidatePath(`/servers/${serverId}/history`);

    return {
      success: true,
      message: "Excluded users updated",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Server action to update excluded libraries for a server
 */
export async function updateExcludedLibrariesAction(
  serverId: number,
  excludedLibraryIds: string[],
) {
  try {
    await db
      .update(servers)
      .set({ excludedLibraryIds })
      .where(eq(servers.id, serverId));

    // Revalidate cache for exclusion settings
    revalidateTag(`exclusion-settings-${serverId}`);

    // Revalidate all statistics pages
    revalidatePath(`/servers/${serverId}/dashboard`);
    revalidatePath(`/servers/${serverId}/settings/exclusions`);
    revalidatePath(`/servers/${serverId}/library`);
    revalidatePath(`/servers/${serverId}/users`);
    revalidatePath(`/servers/${serverId}/history`);

    return {
      success: true,
      message: "Excluded libraries updated",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}
