---
name: Cart proxy and cookie fix
description: Root causes and fixes for the Buy Now / cart flow failure on the STRESSNES web app
---

# Cart Flow Fix — Root Causes and Fixes

## Root Causes Found

1. **No Vite proxy** — Frontend (port 25108) had no proxy for `/api`, so all API calls failed silently. Fix: added `server.proxy` in `artifacts/stressnes/vite.config.ts` pointing `/api` → `http://localhost:8080`.

2. **Guest cart cookie never set** — `resolveCart()` in `artifacts/api-server/src/routes/cart.ts` created new guest carts but never called `res.cookie()`. Every request created a fresh empty cart. Fix: `resolveCart` now accepts `res: Response` and calls `res.cookie(GUEST_CART_COOKIE, sessionId, { httpOnly, maxAge: 30d, sameSite: 'lax' })` when a new sessionId is created. All cart route handlers now pass `res` to `resolveCart`.

3. **Checkout auth redirect** — `artifacts/stressnes/src/pages/checkout.tsx` had `if (!authLoading && !isAuthenticated) { navigate('/login'); return null; }` blocking all guests. Fix: removed completely; removed `useAuth` import from checkout.

4. **Orders route required auth** — `POST /api/orders` used `requireAuth`. Fix: changed to `optionalAuth` and `userId: req.user?.id ?? null` so guest orders insert with null userId (DB column is nullable).

## How to Run the Cart Flow (verified end-to-end)
- DB schema pushed via `pnpm --filter @workspace/db run push`
- Lobster Tee seeded via psql (slug: `maine-lobster-lovers-club-tee`)
- Guest cart: GET /api/cart → creates cart + sets `stressnes_cart` cookie → POST /api/cart → item persists

**Why:** Without the Vite proxy, all `/api/*` calls from the React app went to the Vite dev server (not Express). Without the cookie, every POST created a new cart so the item was always lost.
