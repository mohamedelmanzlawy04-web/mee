---
name: DB setup and seed on fresh environment
description: What must be done on a fresh Replit import before the app works — tables and seed data.
---

# DB Setup and Seed on Fresh Environment

## The rule
On a fresh Replit environment (new clone or import), the database is empty. Two steps are required before the app is functional:

1. `pnpm --filter @workspace/db run push` — creates all 33 tables via drizzle-kit push
2. `pnpm --filter @workspace/scripts run seed` — seeds the 3 Summer '26 products with variants and inventory

**Why:** The `.replit` module list includes `postgresql-16` which provisions a fresh empty DB. Drizzle-kit push maps the schema to that DB. Without seed data, the storefront shows nothing and Buy Now / Add to Cart fails with 500 errors.

## How to apply
- After any fresh import/clone, run both commands before testing the storefront.
- post-merge.sh runs step 1 automatically (drizzle push) but NOT the seed.
- The seed script is at `scripts/seed-summer26.ts`, runnable via `pnpm --filter @workspace/scripts run seed`.
- The scripts package now declares `drizzle-orm`, `pg`, and `@workspace/db` as dependencies (required for ESM resolution in pnpm strict isolation).
