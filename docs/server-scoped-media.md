# Server-scoped media identifiers

Jellyfin media IDs are unique within one server. Libraries, items and media sources therefore use `(server_id, id)` primary keys. Public APIs and Jellyfin calls continue using the original Jellyfin IDs alongside their existing server context.

Item relationships, cast links, watchlists, sync mutations, history joins and statistics lookups carry the server scope. Deleting an item clears only `sessions.item_id`; it preserves the session and its server. The migration's `ON DELETE SET NULL (item_id)` clause is intentional: Drizzle currently models only the general `set null` action.

## Existing installations

Migration `0045_server_scoped_media_ids` preserves historical references when an earlier collision moved an item or library to another server. It creates missing copies under the referencing server, backfills watchlist server IDs, then installs the composite constraints. Copied items have their etag, embedding and processing flags invalidated.

The migration cannot reconstruct metadata already overwritten by an earlier sync. Run a full sync on each affected server after upgrading to restore authoritative library and item metadata. Previously deleted rows without surviving references cannot be recovered by the migration.

The old `0043` snapshot had the same parent as `0042`; its parent link is repaired so Drizzle can generate future migrations. Changes already applied by `0042` and `0044` are not reapplied in `0045`.

## Verification

### Fork integration through upstream 2.22.3

The `chore/sync-upstream-2.22` integration preserves the fork migration history
through `0046_overrated_shadowcat`, including its existing timestamps and
`user_embeddings` table. The upstream SQL files `0045_server_scoped_media_ids`
and `0046_permanent_user_merge` remain as reference sources, but are not separate
entries in this fork journal. Their data-preserving SQL is included in the new
`0047_sync_upstream_2_22` migration, together with the upstream performance-index
repair. The new snapshot includes both upstream and fork tables.

Upstream 2.22.2 added `0047_item_libraries`, which collides with the fork's
`0047`. The fork journals it as `0048_item_libraries` with upstream's SQL and
original timestamp `1794324661230`, which is later than the fork's `0047`, so it
runs after the reconciliation on every fork database. Its snapshot was generated
by Drizzle on top of the fork's `0047` snapshot. Future upstream migrations keep
this offset: renumber them past the fork's latest entry and keep their timestamps.

This ordering matters: Drizzle selects pending migrations by timestamp, not by
filename or SQL hash. An installation running `main-rc` may already have
`0045_lethal_pandemic` recorded at timestamp `1780183104197`; the earlier 2.20
integration can have `0046_overrated_shadowcat` at `1789868066521`. Applying the
upstream journal unchanged would skip older upstream work in these databases.
Do not rename applied migration entries or change their timestamps to compensate.

Migration `0047` clears derived user taste profiles, not playback history. On
startup the job server queues User Embeddings Sync for every server that has item
embeddings but no taste profiles, so recommendations come back without waiting
for the daily schedule (03:00 by default). Run it again from Settings > Jobs once
Full Sync and Embeddings Sync finish to include recovered items. Account merging
also invalidates both affected taste profiles; the merge API queues the rebuild,
and the daily schedule covers it if the job server is unreachable. Profile
calculations share the account-merge advisory lock so an in-flight calculation
cannot republish a pre-merge profile.

Before deploying this fork integration:

1. Stop application/job-server writers and take a complete PostgreSQL backup.
2. Restore it into a separate development database and retain the untouched dump.
3. Inspect `drizzle.__drizzle_migrations` and confirm which fork history was deployed.
4. Run the migration against that copy, checking constraints, history totals,
   watchlists and the new account-merge tables. Exercise the no-pending-migrations
   second run and verify the backup can be restored.
5. Check overlapping Jellyfin IDs on multiple servers, Full Sync, movie/series
   recommendations, taste similarity, history filters and account merging.
6. Repeat the migration against an empty disposable database to verify fresh installs.

The migration has not been rehearsed against the production database yet. Do not
point application startup or migration commands at production for this rehearsal.

### Automated checks

Use a disposable PostgreSQL database with pgvector available and a role permitted to create databases:

```sh
bun run build:database
STREAMYSTATS_TEST_DATABASE_URL=postgresql://postgres@localhost/streamystats_test bun test
```

The sync suite creates and removes its own child database to exercise the upgrade from pre-fix data. The query suite uses unique fixture rows in the supplied test database and removes them afterward. Tests cover overlapping libraries, items, media sources and people; full/recent sync; replacement migration; ownership constraints; deletion behavior; item details; history; statistics; and watchlists.
