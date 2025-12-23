#!/bin/bash
echo "[AIO] Waiting for job-server to be ready..."
until curl -sf http://localhost:3005/health >/dev/null 2>&1; do
    sleep 1
done
echo "[AIO] Starting Next.js..."
cd /app/apps/nextjs-app
exec node server.js

