#!/bin/sh
cd /app
for i in $(seq 1 30); do
  if npx drizzle-kit push --config ./lib/db/drizzle.config.ts 2>&1; then
    echo "=== Schema push succeeded on attempt $i ==="
    break
  fi
  if [ $i -eq 30 ]; then
    echo "=== ERROR: Schema push failed after 30 attempts ==="
  fi
  echo "=== Push attempt $i failed, retrying in 2s... ==="
  sleep 2
done
npx tsx ./lib/db/src/seed.ts 2>&1 || echo "=== WARNING: Seed step skipped ==="
exec node --enable-source-maps ./dist/index.mjs
