"use server";

import "server-only";

import { db } from "@streamystats/database";
import {
  userEmbeddings,
  users as usersTable,
} from "@streamystats/database/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  buildUserTasteSimilarity,
  type UserTasteSimilarityResult,
} from "@/lib/user-taste-similarity";

export async function getUserTasteSimilarity({
  serverId,
}: {
  serverId: number;
}): Promise<UserTasteSimilarityResult> {
  const rows = await db
    .select({
      userId: usersTable.id,
      userName: usersTable.name,
      embedding: userEmbeddings.embedding,
      itemCount: userEmbeddings.itemCount,
      lastCalculatedAt: userEmbeddings.lastCalculatedAt,
    })
    .from(userEmbeddings)
    .innerJoin(
      usersTable,
      and(
        eq(usersTable.id, userEmbeddings.userId),
        eq(usersTable.serverId, userEmbeddings.serverId),
      ),
    )
    .where(eq(userEmbeddings.serverId, serverId))
    .orderBy(asc(usersTable.name));

  return buildUserTasteSimilarity(rows);
}
