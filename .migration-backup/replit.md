# STRESSNES

Luxury fashion ecommerce platform foundation — Next.js 15 with App Router, TypeScript, Tailwind CSS, Prisma ORM, Auth.js, and full integration stubs for Paymob, Bosta, Cloudinary, Resend, and Stripe.

## Run & Operate

- `pnpm --filter @workspace/stressnes run dev` — start the Next.js dev server
- `pnpm --filter @workspace/stressnes run typecheck` — full typecheck
- `pnpm --filter @workspace/stressnes run lint` — ESLint
- `pnpm --filter @workspace/stressnes run format` — Prettier format
- `pnpm --filter @workspace/stressnes run prisma:generate` — regenerate Prisma Client
- `pnpm --filter @workspace/stressnes run prisma:push` — push schema to DB (dev only)
- `pnpm --filter @workspace/stressnes run prisma:migrate` — create and apply migration

## Stack

- Framework: Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Styling: Tailwind CSS v4 + shadcn/ui
- Database: PostgreSQL + Prisma ORM v6
- Auth: Auth.js v5 (NextAuth)
- Forms: React Hook Form + Zod
- Data fetching: TanStack Query v5
- Animation: Framer Motion
- Media: Cloudinary SDK
- Email: Resend SDK
- Payments: Paymob (primary, EG) + Stripe (international, optional)
- Shipping: Bosta

## Where things live

- `artifacts/stressnes/app/` — Next.js App Router pages, layouts, API routes
- `artifacts/stressnes/components/` — UI components (ui/, layout/, shared/, product/, cart/, navigation/, forms/)
- `artifacts/stressnes/lib/` — Core utilities (db, auth, cloudinary, payments, shipping, utils)
- `artifacts/stressnes/actions/` — Next.js Server Actions
- `artifacts/stressnes/services/` — Business logic layer
- `artifacts/stressnes/repositories/` — Data access layer (Prisma)
- `artifacts/stressnes/hooks/` — Custom React hooks
- `artifacts/stressnes/types/` — TypeScript domain types
- `artifacts/stressnes/constants/` — App-wide constants
- `artifacts/stressnes/config/site.ts` — Site metadata and brand config
- `artifacts/stressnes/prisma/schema.prisma` — Database schema
- `artifacts/stressnes/middleware.ts` — Route protection (Auth.js)
- `artifacts/stressnes/app/globals.css` — Design system tokens (colors, typography, spacing, shadows, z-index, animation)

## Architecture decisions

- Next.js App Router chosen for Server Components, streaming, and Server Actions (reduces client JS)
- Auth.js v5 (beta) used over custom auth — avoids JWT/bcrypt implementation bugs
- Paymob is primary payment provider; Stripe is a lazy-initialized optional fallback
- Prisma models intentionally empty in Task 1 — models added in Task 2 to avoid premature schema decisions
- Rate limiting uses in-memory store for simplicity; should be replaced with Upstash Redis at scale
- Repository pattern enforced: components/actions → services → repositories → Prisma (no direct Prisma calls from UI)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Stripe is lazy-initialized — importing `stripe` from `@/lib/payments/stripe` won't throw at import time, only when first used
- Run `pnpm prisma:generate` after every `prisma/schema.prisma` change
- `pnpm prisma:push` is dev-only (no migration file); use `pnpm prisma:migrate` for tracked migrations
- The old `src/` Vite scaffold files remain in the directory but are excluded from the Next.js tsconfig — they are harmless
- shadcn components: add with `pnpm dlx shadcn@latest add <component>` from `artifacts/stressnes/`
