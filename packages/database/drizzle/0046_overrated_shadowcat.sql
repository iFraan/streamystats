-- Realigns the drizzle snapshot with 0044_performance_indexes, which was hand-written
-- upstream without a snapshot. Every statement is a no-op on databases that ran 0044.
CREATE INDEX IF NOT EXISTS "activities_server_date_idx" ON "activities" USING btree ("server_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hidden_recommendations_server_user_idx" ON "hidden_recommendations" USING btree ("server_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_library_id_idx" ON "items" USING btree ("library_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_job_id_idx" ON "job_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_job_name_idx" ON "job_results" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_results_created_at_idx" ON "job_results" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "libraries_server_id_idx" ON "libraries" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_item_id_idx" ON "sessions" USING btree ("item_id");