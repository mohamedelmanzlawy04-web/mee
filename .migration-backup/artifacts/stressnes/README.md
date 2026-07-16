# STRESSNES — Backend Architecture

Luxury fashion ecommerce platform. Production-grade backend built on Next.js 15 App Router, PostgreSQL, Prisma ORM v6, Auth.js v5, and TypeScript (strict, zero `any`).

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Push schema to database (dev — no migration file)
pnpm prisma:push

# Create a tracked migration (production-safe)
pnpm prisma:migrate -- --name <migration-name>

# Seed the database (10 products, 3 collections, 5 categories, admin)
pnpm prisma:seed

# Start the dev server
pnpm dev

# Type-check
pnpm typecheck

# Lint
pnpm lint
```

**Admin credentials (seed):**
- Email: `admin@stressnes.com`
- Password: `Admin@Str3ssnes!`

---

## Architecture

```
artifacts/stressnes/
├── app/
│   ├── api/                    # REST API route handlers (Next.js App Router)
│   │   ├── products/           GET list, POST create
│   │   │   └── [slug]/         GET detail, PATCH update, DELETE
│   │   ├── categories/         GET list, POST create
│   │   │   └── [id]/           GET, PATCH
│   │   ├── collections/        GET list, POST create
│   │   │   └── [id]/           GET, PATCH
│   │   ├── orders/             GET list (own), POST create
│   │   │   └── [id]/           GET detail
│   │   │       └── status/     PATCH (admin only)
│   │   ├── cart/               GET, POST, DELETE
│   │   │   └── [itemId]/       PATCH quantity, DELETE
│   │   ├── wishlist/           GET, POST
│   │   │   └── [itemId]/       DELETE
│   │   ├── reviews/            GET list, POST create
│   │   │   └── [id]/           PATCH status (admin only)
│   │   ├── coupons/            POST create (admin)
│   │   │   └── validate/       POST — validate + calculate discount
│   │   ├── customers/          GET list (admin)
│   │   │   └── [id]/           GET detail (admin)
│   │   ├── inventory/
│   │   │   └── [variantId]/    GET, PATCH adjust (admin)
│   │   ├── newsletter/         POST subscribe, DELETE unsubscribe
│   │   └── contact/            POST submit
│   ├── layout.tsx              Root layout (fonts, SEO, providers)
│   └── globals.css             Design system tokens
│
├── lib/
│   ├── api/
│   │   ├── response.ts         HTTP response helpers (ok, created, paginated…)
│   │   └── auth.ts             requireAuth / requireAdmin guards
│   ├── auth/                   Auth.js v5 config + handlers
│   ├── db/prisma.ts            Prisma singleton
│   ├── payments/
│   │   ├── stripe.ts           Stripe SDK (lazy init)
│   │   └── paymob/             Paymob placeholder
│   ├── shipping/bosta/         Bosta placeholder
│   ├── cloudinary/             Upload / delete helpers
│   └── validations/            Zod schemas for every endpoint
│       ├── product.ts
│       ├── order.ts
│       ├── cart.ts
│       ├── coupon.ts
│       ├── review.ts
│       ├── user.ts
│       ├── newsletter.ts
│       ├── contact.ts
│       └── inventory.ts
│
├── repositories/               Pure data-access layer (Prisma only)
│   ├── product.repository.ts
│   ├── user.repository.ts
│   ├── order.repository.ts
│   ├── cart.repository.ts
│   ├── wishlist.repository.ts
│   ├── inventory.repository.ts
│   ├── coupon.repository.ts
│   ├── review.repository.ts
│   ├── category.repository.ts
│   └── collection.repository.ts
│
├── services/                   Business logic — orchestrates repositories
│   ├── product.service.ts
│   ├── user.service.ts
│   ├── order.service.ts
│   ├── cart.service.ts
│   ├── wishlist.service.ts
│   ├── inventory.service.ts
│   ├── coupon.service.ts
│   ├── payment.service.ts
│   ├── shipping.service.ts
│   └── review.service.ts
│
├── prisma/
│   ├── schema.prisma           Complete database schema (24 models)
│   ├── seed.ts                 Seed script (admin + 10 products)
│   └── migrations/             Tracked migration history
│
├── middleware.ts               Route protection via Auth.js
└── middleware/rate-limit.ts    In-memory rate limiter
```

---

## Data Architecture

### Layer Rules

```
API routes → services → repositories → Prisma → PostgreSQL
```

- **API routes** handle HTTP (request parsing, auth guards, response formatting). Never call Prisma directly.
- **Services** contain all business logic (stock checks, coupon validation, order totals). Never touch HTTP.
- **Repositories** are the only layer that calls Prisma. They never contain business logic.
- **Validations** (Zod schemas) live in `lib/validations/` and are imported by both API routes and services.

---

## Database Models

### User & Auth

| Model | Description |
|---|---|
| `User` | Customers, admins, and moderators. Soft-deleted. UUID PK. |
| `Account` | NextAuth OAuth provider accounts (Google, etc.) |
| `VerificationToken` | NextAuth email verification tokens |
| `Address` | Saved shipping/billing addresses (one-to-many with User) |

**User roles:** `CUSTOMER` · `ADMIN` · `MODERATOR`

### Product Catalog

| Model | Description |
|---|---|
| `Product` | Core product entity. Slug-indexed. Soft-deleted. Supports SEO fields. |
| `ProductVariant` | Size/color/material variants with independent SKU and optional price override |
| `ProductImage` | Cloudinary-hosted images with sort order and primary flag |
| `Category` | Top-level categories (Tops, Bottoms, Outerwear, Accessories, Footwear) |
| `SubCategory` | Child of Category — enables two-tier taxonomy |
| `Collection` | Curated drops (Summer, Core, Limited Edition) with optional date range |
| `ProductTag` | Flexible M-N tags (new-arrival, sale, bestseller…) |

**Product status:** `DRAFT` · `ACTIVE` · `ARCHIVED`

### Inventory

| Model | Description |
|---|---|
| `Inventory` | Per-variant stock: `currentStock`, `reservedStock`, `lowStockThreshold` |
| `InventoryHistory` | Full audit log of every stock change with reason and previous/new values |

**Change reasons:** `PURCHASE` · `RETURN` · `ADJUSTMENT` · `RESERVATION` · `RELEASE` · `DAMAGE` · `RESTOCK`

**Available stock formula:** `availableStock = currentStock − reservedStock`

### Shopping

| Model | Description |
|---|---|
| `Cart` | Supports authenticated users (userId) and guests (sessionId). Expiry field. |
| `CartItem` | Line item with price snapshot at time of adding. Unique on (cart, product, variant). |
| `Wishlist` | One per authenticated user |
| `WishlistItem` | Unique on (wishlist, product, variant) |

### Orders

| Model | Description |
|---|---|
| `Order` | Full order record with JSON address snapshots (frozen at purchase time). Soft-deleted. |
| `OrderItem` | Immutable snapshot of product+variant at purchase time. Prevents historical price drift. |

**Order status lifecycle:** `PENDING` → `PAID` → `PROCESSING` → `PACKED` → `SHIPPED` → `DELIVERED`  
**Terminal states:** `CANCELLED` · `REFUNDED`

### Payments

| Model | Description |
|---|---|
| `Payment` | Per-order payment record. Supports multiple providers and gateway response storage. |
| `Transaction` | Individual financial events (charge, refund, partial refund) linked to a Payment |

**Providers:** `PAYMOB` (primary, Egypt) · `STRIPE` (international) · `CASH_ON_DELIVERY`

### Discounts

| Model | Description |
|---|---|
| `Coupon` | Percentage or fixed-amount codes. Supports min spend, max discount cap, usage limits, per-user limits, expiry. |
| `CouponUsage` | Tracks who used which coupon on which order. Prevents double-use. |

### Reviews

| Model | Description |
|---|---|
| `Review` | 1–5 rating with optional comment. Verified-purchase flag. Moderation status. |
| `ReviewImage` | Cloudinary-hosted images attached to a review |

**Review status:** `PENDING` → `APPROVED` · `REJECTED`

### Shipping & Other

| Model | Description |
|---|---|
| `ShippingMethod` | Available carriers (Bosta, Mylerz, Aramex, Manual) with price and ETA |
| `NewsletterSubscriber` | Email opt-in list with subscribe/unsubscribe timestamps |
| `ContactMessage` | Support form submissions with status tracking |

---

## API Reference

All endpoints return `{ error: string }` on failure. Paginated endpoints return:
```json
{ "data": [], "total": 0, "page": 1, "pageSize": 24, "totalPages": 0 }
```

### Authentication
Auth routes are handled by Auth.js: `GET|POST /api/auth/[...nextauth]`

### Products
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | List products (paginated, filterable) |
| `POST` | `/api/products` | Admin | Create product |
| `GET` | `/api/products/:slug` | Public | Get product detail |
| `PATCH` | `/api/products/:slug` | Admin | Update product |
| `DELETE` | `/api/products/:slug` | Admin | Soft-delete product |

**Query params:** `page`, `pageSize`, `status`, `categoryId`, `collectionId`, `featured`, `published`, `search`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`

### Categories & Collections
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | All active categories with subcategories |
| `POST` | `/api/categories` | Admin | Create category |
| `PATCH` | `/api/categories/:id` | Admin | Update category |
| `GET` | `/api/collections` | Public | All active collections |
| `POST` | `/api/collections` | Admin | Create collection |
| `PATCH` | `/api/collections/:id` | Admin | Update collection |

### Cart
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Session | Get or create cart |
| `POST` | `/api/cart` | Session | Add item to cart |
| `DELETE` | `/api/cart` | Session | Clear entire cart |
| `PATCH` | `/api/cart/:itemId` | Session | Update item quantity |
| `DELETE` | `/api/cart/:itemId` | Session | Remove item |

### Wishlist
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/wishlist` | User | Get wishlist |
| `POST` | `/api/wishlist` | User | Add item |
| `DELETE` | `/api/wishlist/:itemId` | User | Remove item |

### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/orders` | User | List own orders (Admin sees all) |
| `POST` | `/api/orders?cartId=` | User | Create order from cart |
| `GET` | `/api/orders/:id` | User | Get order (own or admin) |
| `PATCH` | `/api/orders/:id/status` | Admin | Update order status |

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews?productId=` | Public | List reviews |
| `POST` | `/api/reviews` | User | Submit review |
| `PATCH` | `/api/reviews/:id` | Admin | Approve or reject review |

### Coupons
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/coupons/validate` | Optional | Validate coupon + calculate discount |
| `POST` | `/api/coupons` | Admin | Create coupon |

### Customers
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Admin | List customers (paginated) |
| `GET` | `/api/customers/:id` | Admin | Get customer profile |

### Inventory
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/inventory/:variantId` | Admin | Get inventory + history |
| `PATCH` | `/api/inventory/:variantId` | Admin | Adjust stock |

### Other
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/newsletter` | Public | Subscribe |
| `DELETE` | `/api/newsletter` | Public | Unsubscribe |
| `POST` | `/api/contact` | Public | Submit contact message |

---

## Security

- **Input validation** — all endpoint inputs go through Zod before any processing
- **SQL injection** — impossible: Prisma uses parameterised queries exclusively
- **Duplicate orders** — prevented by clearing the cart atomically inside the same DB transaction that creates the order
- **Inventory race conditions** — stock reservation uses Prisma `increment`/`decrement` (atomic DB-level updates)
- **Authentication** — Auth.js v5 with JWT strategy; route protection in `middleware.ts`
- **Role-based access** — `requireAdmin()` / `requireAuth()` guards in `lib/api/auth.ts`
- **Rate limiting** — in-memory limiter in `middleware/rate-limit.ts` (replace with Upstash Redis in production)

---

## Environment Variables

Copy `.env.example` and fill in your values:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe (optional — international orders)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Paymob (primary — Egypt orders)
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Bosta (shipping)
BOSTA_API_KEY=
BOSTA_ACCOUNT_ID=
```

---

## Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type check |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier format |
| `pnpm prisma:push` | Push schema to DB (dev, no migration) |
| `pnpm prisma:migrate` | Create + apply a tracked migration |
| `pnpm prisma:seed` | Seed the database |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:generate` | Regenerate Prisma Client |
