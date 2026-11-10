import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const journal = readJournal();
const migrations = readMigrationFiles({ migrationsFolder });
const reconciliationTag = "0047_sync_upstream_2_22";
const reconciliation = readFileSync(
  join(migrationsFolder, `${reconciliationTag}.sql`),
  "utf8",
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJournal() {
  const parsed: unknown = JSON.parse(
    readFileSync(join(migrationsFolder, "meta/_journal.json"), "utf8"),
  );
  if (!isRecord(parsed) || !Array.isArray(parsed.entries))
    throw new Error("Invalid migration journal");
  return {
    entries: parsed.entries.map((entry: unknown) => {
      if (
        !isRecord(entry) ||
        typeof entry.idx !== "number" ||
        typeof entry.tag !== "string" ||
        typeof entry.when !== "number"
      )
        throw new Error("Invalid migration entry");
      return { idx: entry.idx, tag: entry.tag, when: entry.when };
    }),
  };
}

function withoutComments(content: string): string {
  return content
    .split(/\r?\n/)
    .filter((line) => !/^\s*--(?!>)/.test(line))
    .join("\n")
    .trim();
}

describe("fork migration history", () => {
  test("loads every journaled SQL file and preserves historical watermarks", () => {
    expect(migrations).toHaveLength(journal.entries.length);
    expect(new Set(journal.entries.map((entry) => entry.idx)).size).toBe(
      journal.entries.length,
    );
    for (const [index, entry] of journal.entries.entries()) {
      expect(entry.idx).toBe(index);
      if (index > 0)
        expect(entry.when).toBeGreaterThan(journal.entries[index - 1].when);
    }
    expect(journal.entries[45]).toMatchObject({
      tag: "0045_lethal_pandemic",
      when: 1780183104197,
    });
    expect(journal.entries[46]).toMatchObject({
      tag: "0046_overrated_shadowcat",
      when: 1789868066521,
    });
  });

  test.each([
    { name: "main-rc", watermark: 1780183104197 },
    { name: "2.20 integration", watermark: 1789868066521 },
  ])("runs reconciliation after an applied $name database", ({ watermark }) => {
    const pending = journal.entries.filter((entry) => entry.when > watermark);
    expect(pending.map((entry) => entry.tag)).toContain(reconciliationTag);
    const entry = journal.entries.find(
      (entry) => entry.tag === reconciliationTag,
    );
    expect(entry).toBeDefined();
    expect(
      migrations.find((migration) => migration.folderMillis === entry?.when),
    ).toBeDefined();
  });

  test("carries upstream index repair, media recovery and account triggers in order", () => {
    const expected = [
      "0044_performance_indexes.sql",
      "0045_server_scoped_media_ids.sql",
      "0046_permanent_user_merge.sql",
    ]
      .map((name) =>
        withoutComments(readFileSync(join(migrationsFolder, name), "utf8")),
      )
      .join("\n--> statement-breakpoint\n");
    expect(withoutComments(reconciliation)).toBe(
      `${expected}\n--> statement-breakpoint\nDELETE FROM "user_embeddings";`,
    );
    expect(reconciliation).toContain('ON DELETE SET NULL ("item_id")');
    expect(reconciliation).toContain("media_identity_recovery");
    expect(reconciliation).toContain("CREATE TRIGGER retired_user_guard");
  });

  test("keeps a single linked snapshot chain including the fork tables", () => {
    const directory = join(migrationsFolder, "meta");
    const snapshots = readdirSync(directory)
      .filter((name) => name.endsWith("_snapshot.json"))
      .sort()
      .map((name) => {
        const snapshot: unknown = JSON.parse(
          readFileSync(join(directory, name), "utf8"),
        );
        if (
          !isRecord(snapshot) ||
          typeof snapshot.id !== "string" ||
          typeof snapshot.prevId !== "string" ||
          !isRecord(snapshot.tables)
        )
          throw new Error("Invalid migration snapshot");
        return {
          id: snapshot.id,
          prevId: snapshot.prevId,
          tables: snapshot.tables,
        };
      });
    expect(new Set(snapshots.map((snapshot) => snapshot.id)).size).toBe(
      snapshots.length,
    );
    for (let index = 1; index < snapshots.length; index++) {
      expect(snapshots[index].prevId).toBe(snapshots[index - 1].id);
    }
    const latest = snapshots.at(-1);
    expect(latest?.tables["public.user_embeddings"]).toBeDefined();
    expect(latest?.tables["public.user_merges"]).toBeDefined();
    expect(latest?.tables["public.user_merge_audit"]).toBeDefined();
  });
});
