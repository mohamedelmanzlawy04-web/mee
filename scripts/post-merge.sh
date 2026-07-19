#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/scripts run seed:gov
pnpm --filter @workspace/scripts run seed:admin
