ALTER TABLE "servers"
ADD COLUMN IF NOT EXISTS "excluded_user_ids" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "servers"
ALTER COLUMN "excluded_user_ids" SET DEFAULT '{}';--> statement-breakpoint

ALTER TABLE "servers"
ADD COLUMN IF NOT EXISTS "excluded_library_ids" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "servers"
ALTER COLUMN "excluded_library_ids" SET DEFAULT '{}';--> statement-breakpoint