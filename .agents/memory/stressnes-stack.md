---
name: STRESSNES stack decisions
description: Key technology and architecture choices for the STRESSNES luxury fashion e-commerce port
---

# STRESSNES Stack Decisions

## Products
Three canonical products, all at 750 EGP, slug-driven:
- `lobster-tee` — Lobster Tee, BOXY FIT
- `sea-calls-me-tee` — Sea Calls Me Tee, BOXY FIT
- `bonna-appetit-tee` — Bonna Appétit Tee, REGULAR FIT

Each has M/L/XL variants (SKUs: `STRS-LBST-001-M`, etc.), 3 images, 25 stock per variant.
Collection: `summer-26`, Category: `t-shirts`.

## Frontend
- React + Vite (port 25108) in `artifacts/stressnes/`
- Static fallback data in `src/data/static-products.ts` — used when API unavailable; slugs match real DB slugs so API product takes priority
- `src/pages/product.tsx` — size selection → variant ID → add to cart / buy now
- `src/components/cart/CartSidebar.tsx` — uses `getProductImage(item.product?.images)`

## API Server
- Express 5 (port 8080) in `artifacts/api-server/`
- Cart: guest carts via `stressnes_cart` cookie (30-day, HttpOnly, SameSite=Lax)
- Orders: `optionalAuth` → cart resolved server-side from session cookie, never trusts client cartId (IDOR fix)
- `getCartWithItems` fetches primary product images for CartSidebar rendering

## Vite Proxy
`/api` → `http://localhost:8080` (added in vite.config.ts)

**Why:** Frontend at different port than API; proxy required for cookies and CORS to work in dev.

## Auth
- Guest checkout: no account needed. Login button hidden from navbar for unauthenticated users.
- Admin routes still use `requireAuth`/`requireAdmin`.
- `orders.userId` is nullable (schema + DB column both nullable).
