---
name: STRESSNES Architecture
description: Layer rules, key decisions, and non-obvious gotchas for the STRESSNES luxury fashion ecommerce backend.
---

## Layer rules (strictly enforced)
API routes → services → repositories → Prisma. No layer may skip one.
- API routes: HTTP only — parse, guard, respond. Never call Prisma directly.
- Services: business logic only. Never touch NextRequest/NextResponse.
- Repositories: Prisma only. No business logic.

## Stripe lazy init
`lib/payments/stripe.ts` uses a Proxy so importing `stripe` never throws. The real client is only created on first property access. Do not add a top-level `if (!key) throw` guard — it would break builds without STRIPE_SECRET_KEY set.

## Prisma JSON null
Nullable JSON fields (`variantSnapshot`, `gatewayResponse`, `metadata`) must use `Prisma.JsonNull` — not plain `null`. Using `null` directly causes a TS2322 type error in strict mode.

**Why:** Prisma distinguishes `Prisma.JsonNull` (explicit DB NULL) from `undefined` (omit the field) for JSON columns.

## Prisma migration baseline
Database was first created via `prisma db push` (no migration history). To add a tracked migration afterward:
1. `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql`
2. `prisma migrate resolve --applied <timestamp>_<name>`

**Why:** `prisma migrate dev` refuses to run when the DB has schema but no migration table, prompting a destructive reset.

## Cart guest support
Cart supports both `userId` (authenticated) and `sessionId` (guest). `resolveCart()` in `app/api/cart/route.ts` picks the right one from the session/cookie. Setting the guest session cookie must happen at the response level (can't be done inside `GET` handlers in Next.js App Router).

## Inventory reservation pattern
Stock reservation uses Prisma `increment`/`decrement` (atomic DB-level). `reservedStock` is incremented when an order is created; released when cancelled. `availableStock = currentStock - reservedStock` is computed, not stored.

## Order address snapshots
Order `shippingAddress` and `billingAddress` are stored as `Json` columns — snapshots frozen at purchase time. Never reference the live `Address` model from an order; it may have changed since.

## Seed admin credentials
admin@stressnes.com / Admin@Str3ssnes! (bcrypt hash, 12 rounds)
Seed is idempotent — safe to re-run.

## Next.js App Router params
Route handler `params` are a `Promise` in Next.js 15 — must be `await`ed: `const { id } = await params`.

## `prisma` package.json config deprecation
The `"prisma": { "seed": "..." }` key in package.json triggers a Prisma 7 deprecation warning. It still works in Prisma 6. Migrate to `prisma.config.ts` when upgrading to Prisma 7.
