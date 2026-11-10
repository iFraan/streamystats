CREATE INDEX IF NOT EXISTS "libraries_server_id_idx" ON "libraries" ("server_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_server_date_idx" ON "activities" ("server_id", "date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_job_id_idx" ON "job_results" ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_job_name_idx" ON "job_results" ("job_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_created_at_idx" ON "job_results" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_library_id_idx" ON "items" ("library_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_item_id_idx" ON "sessions" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hidden_recommendations_server_user_idx" ON "hidden_recommendations" ("server_id", "user_id");--> statement-breakpoint
DROP INDEX IF EXISTS "items_deleted_at_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_deleted_at_idx" ON "items" ("deleted_at") WHERE "deleted_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_active_server_type_idx" ON "items" ("server_id", "type") WHERE "deleted_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "item_people" DROP CONSTRAINT "item_people_unique";--> statement-breakpoint
ALTER TABLE "hidden_recommendations" DROP CONSTRAINT "hidden_recommendations_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "item_people" DROP CONSTRAINT "item_people_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_library_id_libraries_id_fk";
--> statement-breakpoint
ALTER TABLE "media_sources" DROP CONSTRAINT "media_sources_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP CONSTRAINT "watchlist_items_watchlist_id_watchlists_id_fk";
--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP CONSTRAINT "watchlist_items_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_pkey";--> statement-breakpoint
ALTER TABLE "libraries" DROP CONSTRAINT "libraries_pkey";--> statement-breakpoint
ALTER TABLE "media_sources" DROP CONSTRAINT "media_sources_pkey";--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_server_id_id_pk" PRIMARY KEY("server_id","id");--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_server_id_id_pk" PRIMARY KEY("server_id","id");--> statement-breakpoint
ALTER TABLE "media_sources" ADD CONSTRAINT "media_sources_server_id_id_pk" PRIMARY KEY("server_id","id");--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN "server_id" integer;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_server_id_id_unique" UNIQUE("server_id","id");
--> statement-breakpoint
UPDATE watchlist_items wi SET server_id = w.server_id
FROM watchlists w WHERE w.id = wi.watchlist_id;
--> statement-breakpoint
ALTER TABLE watchlist_items ALTER COLUMN server_id SET NOT NULL;
--> statement-breakpoint
CREATE TEMP TABLE media_identity_recovery ON COMMIT DROP AS
SELECT DISTINCT refs.server_id, refs.item_id, i.library_id
FROM (
  SELECT server_id, item_id FROM sessions WHERE item_id IS NOT NULL
  UNION SELECT server_id, item_id FROM hidden_recommendations
  UNION SELECT server_id, item_id FROM item_people
  UNION SELECT server_id, item_id FROM media_sources
  UNION SELECT server_id, item_id FROM watchlist_items
) refs
JOIN items i ON i.id = refs.item_id
WHERE NOT EXISTS (
  SELECT 1 FROM items owned WHERE owned.server_id = refs.server_id AND owned.id = refs.item_id
);
--> statement-breakpoint
INSERT INTO libraries (server_id, id, name, type, created_at, updated_at)
SELECT DISTINCT refs.server_id, l.id, l.name, l.type, l.created_at, l.updated_at
FROM (
  SELECT server_id, library_id FROM items
  UNION SELECT server_id, library_id FROM media_identity_recovery
) refs
JOIN libraries l ON l.id = refs.library_id
WHERE NOT EXISTS (
  SELECT 1 FROM libraries owned WHERE owned.server_id = refs.server_id AND owned.id = refs.library_id
)
ON CONFLICT (server_id, id) DO NOTHING;
--> statement-breakpoint
INSERT INTO items
SELECT (jsonb_populate_record(NULL::items, to_jsonb(i) || jsonb_build_object(
  'server_id', refs.server_id,
  'etag', NULL,
  'embedding', NULL,
  'processed', false,
  'people_synced', false,
  'media_sources_synced', false
))).*
FROM media_identity_recovery refs
JOIN items i ON i.id = refs.item_id
ON CONFLICT (server_id, id) DO NOTHING;
--> statement-breakpoint
ALTER TABLE "hidden_recommendations" ADD CONSTRAINT "hidden_recommendations_items_server_fk" FOREIGN KEY ("server_id","item_id") REFERENCES "public"."items"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_people" ADD CONSTRAINT "item_people_items_server_fk" FOREIGN KEY ("server_id","item_id") REFERENCES "public"."items"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_libraries_server_fk" FOREIGN KEY ("server_id","library_id") REFERENCES "public"."libraries"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_sources" ADD CONSTRAINT "media_sources_items_server_fk" FOREIGN KEY ("server_id","item_id") REFERENCES "public"."items"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_items_server_fk" FOREIGN KEY ("server_id","item_id") REFERENCES "public"."items"("server_id","id") ON DELETE SET NULL ("item_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_server_fk" FOREIGN KEY ("server_id","watchlist_id") REFERENCES "public"."watchlists"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_items_server_fk" FOREIGN KEY ("server_id","item_id") REFERENCES "public"."items"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_people" ADD CONSTRAINT "item_people_unique" UNIQUE("server_id","item_id","person_id","type");--> statement-breakpoint
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_server_id_id_unique' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_server_id_id_unique" UNIQUE("server_id","id");
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_merge_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"operation_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"request_hash" text NOT NULL,
	"source_user_id" text NOT NULL,
	"source_name" text NOT NULL,
	"target_user_id" text NOT NULL,
	"target_name" text NOT NULL,
	"transferred" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_merge_audit_operation_unique" UNIQUE("server_id","operation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_merges" (
	"server_id" integer NOT NULL,
	"source_user_id" text NOT NULL,
	"source_name" text NOT NULL,
	"target_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_merges_server_id_source_user_id_pk" PRIMARY KEY("server_id","source_user_id")
);
--> statement-breakpoint
ALTER TABLE "user_merge_audit" DROP CONSTRAINT IF EXISTS "user_merge_audit_server_id_servers_id_fk";--> statement-breakpoint
ALTER TABLE "user_merge_audit" ADD CONSTRAINT "user_merge_audit_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_merges" DROP CONSTRAINT IF EXISTS "user_merges_server_id_servers_id_fk";--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_merges" DROP CONSTRAINT IF EXISTS "user_merges_target_fk";--> statement-breakpoint
ALTER TABLE "user_merges" ADD CONSTRAINT "user_merges_target_fk" FOREIGN KEY ("server_id","target_user_id") REFERENCES "public"."users"("server_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
--> statement-breakpoint
CREATE OR REPLACE FUNCTION streamystats_retired_user_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock_shared(582, NEW.server_id);
  IF EXISTS (SELECT 1 FROM user_merges WHERE server_id = NEW.server_id AND source_user_id = NEW.id) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS retired_user_guard ON users;
--> statement-breakpoint
CREATE TRIGGER retired_user_guard BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION streamystats_retired_user_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION streamystats_merge_session_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destination text;
BEGIN
  PERFORM pg_advisory_xact_lock_shared(582, NEW.server_id);
  SELECT target_user_id INTO destination FROM user_merges
    WHERE server_id = NEW.server_id AND source_user_id = COALESCE(NEW.user_id, NEW.user_server_id);
  IF destination IS NOT NULL THEN
    NEW.user_id := destination;
    SELECT name INTO NEW.user_name FROM users WHERE id = destination AND server_id = NEW.server_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_session_owner ON sessions;
--> statement-breakpoint
CREATE TRIGGER merge_session_owner BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_session_owner();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION streamystats_merge_record_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destination text;
BEGIN
  PERFORM pg_advisory_xact_lock_shared(582, NEW.server_id);
  SELECT target_user_id INTO destination FROM user_merges
    WHERE server_id = NEW.server_id AND source_user_id = NEW.user_id;
  IF destination IS NOT NULL THEN
    IF TG_TABLE_NAME = 'user_fingerprints' THEN RETURN NULL; END IF;
    NEW.user_id := destination;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_record_owner ON activities;
--> statement-breakpoint
CREATE TRIGGER merge_record_owner BEFORE INSERT OR UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_record_owner();
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_record_owner ON watchlists;
--> statement-breakpoint
CREATE TRIGGER merge_record_owner BEFORE INSERT OR UPDATE ON watchlists
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_record_owner();
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_record_owner ON hidden_recommendations;
--> statement-breakpoint
CREATE TRIGGER merge_record_owner BEFORE INSERT OR UPDATE ON hidden_recommendations
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_record_owner();
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_record_owner ON anomaly_events;
--> statement-breakpoint
CREATE TRIGGER merge_record_owner BEFORE INSERT OR UPDATE ON anomaly_events
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_record_owner();
--> statement-breakpoint
DROP TRIGGER IF EXISTS merge_record_owner ON user_fingerprints;
--> statement-breakpoint
CREATE TRIGGER merge_record_owner BEFORE INSERT OR UPDATE ON user_fingerprints
FOR EACH ROW EXECUTE FUNCTION streamystats_merge_record_owner();
--> statement-breakpoint
DELETE FROM "user_embeddings";
