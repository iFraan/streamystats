"use server";

import { db } from "@streamystats/database";
import { servers } from "@streamystats/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Server action to update the disabled holidays for a server
 */
export async function updateDisabledHolidaysAction(
  serverId: number,
  disabledHolidays: string[],
) {
  try {
    await db
      .update(servers)
      .set({ disabledHolidays })
      .where(eq(servers.id, serverId));

    // Revalidate the dashboard to reflect changes
    revalidatePath(`/servers/${serverId}/dashboard`);
    revalidatePath(`/servers/${serverId}/settings/seasonal-recommendations`);

    return {
      success: true,
      message: "Holiday settings updated",
    };
  } catch (error) {
    console.error("Error updating disabled holidays:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}
