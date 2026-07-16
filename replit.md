# STRESSNES — Luxury Fashion Ecommerce

A full-stack luxury fashion ecommerce platform built on the Replit pnpm workspace stack.

## Architecture

This is a pnpm monorepo with two runnable artifacts:

| Artifact | Path | URL | Purpose |
|---|---|---|---|
| Frontend (Vite + React) | `artifacts/stressnes/` | `/` | Customer-facing storefront |
| API Server (Express) | `artifacts/api-server/` | `/api` | RESTful backend |

Shared packages:
- `lib/db/` — Drizzle ORM schema + PostgreSQL client
- `lib/api-spec/` — OpenAPI 3.1 spec (source of truth for API contracts)
- `lib/api-client-react/` — Generated React Query hooks (from codegen)
- `lib/api-zod/` — Generated Zod validation schemas (from codegen)

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Wouter, TanStack Query, ShadcN UI, next-themes
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, JWT auth, bcryptjs, Pino logging
- **Fonts**: Inter (sans), Playfair Display (serif) via Google Fonts
- **Design**: Luxury minimal — near-black + antique gold (#C8A96E) + warm white

## Running the App

Workflows are managed by Replit. Both start automatically:
- `artifacts/stressnes: web` — Vite dev server on port 25108
- `artifacts/api-server: API Server` — Express on port 8080

**Do not run `pnpm dev` at the workspace root.** Use `WorkflowsRestart` or the Replit workflow UI.

## Database

Uses Replit's built-in PostgreSQL. Schema is managed via Drizzle ORM.

To push schema changes:
```bash
pnpm --filter @workspace/db run push
```

## API Codegen

The OpenAPI spec at `lib/api-spec/openapi.yaml` generates typed React Query hooks and Zod schemas:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Domain Model

- **Products** — with images, variants (size/color), categories, collections
- **Cart** — supports authenticated users and guest sessions (cookie-based)
- **Orders** — created from cart, with shipping address and optional coupon
- **Auth** — JWT-based, stored in httpOnly cookie; roles: CUSTOMER, ADMIN
- **Reviews** — per-product, approval workflow
- **Wishlist** — authenticated users only
- **Coupons** — percentage or fixed-amount, with validation endpoint
- **Inventory** — per-variant stock tracking with adjustment history
- **Newsletter** — email subscriptions
- **Contact** — contact form submissions

## User Preferences

- Luxury minimal aesthetic: near-black primary, antique gold accent, Playfair Display serif headings
- Currency: EGP (Egyptian Pound) as default
- No console.log in server code — use `req.log` in routes and `logger` singleton elsewhere
