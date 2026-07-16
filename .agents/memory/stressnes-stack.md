---
name: STRESSNES stack decisions
description: Architecture and technology choices for the STRESSNES luxury fashion ecommerce Replit port
---

# STRESSNES Stack Decisions

## Frontend (artifacts/stressnes)
- **Vite + React** (not Next.js) — wouter for routing, TanStack Query for data fetching
- **Fonts**: Playfair Display (serif headlines) + Inter (sans body) via Google Fonts in index.html
- **Design tokens**: HSL palette — near-white bg (`0 0% 98%`), near-black fg (`0 0% 5%`), gold accent (`38 50% 55%`); dark mode inverted; `--radius: 0.25rem` for luxury minimal feel
- **Theme**: next-themes (ThemeProvider), sonner (Toaster)

## Backend (artifacts/api-server)
- **Express 5** with Drizzle ORM via `@workspace/db`
- **Auth**: bcryptjs (password hashing) + jsonwebtoken (JWT, 30d expiry), cookies + Bearer header support
- **Routes**: 13 route modules — auth, products, categories, collections, cart, orders, customers, reviews, wishlist, coupons, inventory, newsletter, contact
- **Middleware**: `src/middlewares/auth.ts` — requireAuth, requireAdmin, optionalAuth, signToken, verifyToken

## Database (lib/db)
- **Drizzle ORM** on Postgres — 25 models across 5 schema files (users, catalog, commerce, social, support)
- Schema uses `zod/v4` subpath for type inference in schema files
- DB push: `pnpm --filter @workspace/db run push`

## API codegen pipeline (lib/api-spec)
- orval 8.21 generates React Query hooks (lib/api-client-react) + Zod schemas (lib/api-zod) from openapi.yaml
- After codegen, sed patches generated file to use `zod/v4` import (see orval-zod-v4.md)
- Run: `pnpm --filter @workspace/api-spec run codegen`

## Known gaps (deferred to follow-up tasks)
- Frontend is still a "Coming Soon" placeholder — full storefront UI is Task #2
- Checkout doesn't check inventory stock atomically — Task #4
- No mobile app yet — Task #3
