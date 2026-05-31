"use server";

import { db } from "@streamystats/database";
import { items, userEmbeddings } from "@streamystats/database/schema";
import { and, cosineDistance, eq, isNotNull, sql } from "drizzle-orm";

export async function getItemTasteSimilarity({
  serverId,
  userId,
  itemId,
}: {
  serverId: number;
  userId: string;
  itemId: string;
}): Promise<number | null> {
  const userProfile = await db
    .select({ embedding: userEmbeddings.embedding })
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.serverId, serverId),
        eq(userEmbeddings.userId, userId),
      ),
    )
    .limit(1);

  if (userProfile.length === 0) {
    return null;
  }

  const similarity = sql<number>`1 - (${cosineDistance(
    items.embedding,
    userProfile[0].embedding,
  )})`;

  const result = await db
    .select({ similarity })
    .from(items)
    .where(
      and(
        eq(items.id, itemId),
        eq(items.serverId, serverId),
        isNotNull(items.embedding),
      ),
    )
    .limit(1);

  return result.length === 0 ? null : Number(result[0].similarity);
}
