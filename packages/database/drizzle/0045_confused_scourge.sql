CREATE INDEX "hidden_recommendations_server_user_item_idx" ON "hidden_recommendations" USING btree ("server_id","user_id","item_id");--> statement-breakpoint
CREATE INDEX "sessions_server_user_item_idx" ON "sessions" USING btree ("server_id","user_id","item_id");--> statement-breakpoint
CREATE INDEX "sessions_server_user_series_idx" ON "sessions" USING btree ("server_id","user_id","series_id");