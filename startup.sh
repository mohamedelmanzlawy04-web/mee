#!/bin/sh
set -e

cd /app

echo "=== Step 1: Waiting for database to be reachable ==="
# Wait for the database to be reachable (Railway databases may take a few seconds to provision)
MAX_RETRIES=30
RETRY_INTERVAL=2
for i in $(seq 1 $MAX_RETRIES); do
  if npx drizzle-kit push --config ./lib/db/drizzle.config.ts 2>&1; then
    echo "=== drizzle-kit push succeeded on attempt $i ==="
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "=== ERROR: drizzle-kit push failed after $MAX_RETRIES attempts ==="
    echo "=== The server will start anyway, but tables may be missing ==="
    break
  fi
  echo "=== drizzle-kit push attempt $i failed, retrying in ${RETRY_INTERVAL}s... ==="
  sleep $RETRY_INTERVAL
done

echo "=== Step 2: Running seed ==="
if npx tsx ./lib/db/src/seed.ts 2>&1; then
  echo "=== Seed completed ==="
else
  echo "=== WARNING: Seed failed (tables may already be seeded) ==="
fi

echo "=== Step 3: Starting server ==="
node --enable-source-maps ./dist/index.mjs
