# STRESSNES — Developer Guide

Luxury fashion ecommerce platform built on Next.js 15.

---

## Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in real values in .env.local

# 3. Initialize the database
pnpm prisma:push

# 4. Start development server
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Prisma ORM |
| Auth | Auth.js v5 (NextAuth) |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query v5 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Media | Cloudinary |
| Email | Resend |
| Payments (EG) | Paymob |
| Payments (INT) | Stripe |
| Shipping | Bosta |

---

## Folder Architecture

```
artifacts/stressnes/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (fonts, providers, metadata)
│   ├── page.tsx            # Home page
│   ├── globals.css         # Design system tokens + Tailwind
│   ├── error.tsx           # Global error boundary
│   ├── not-found.tsx       # 404 page
│   ├── loading.tsx         # Global loading state
│   ├── sitemap.ts          # Dynamic sitemap.xml
│   ├── robots.ts           # Dynamic robots.txt
│   └── api/auth/           # NextAuth route handler
│
├── components/
│   ├── ui/                 # shadcn/ui primitives (add via: pnpm dlx shadcn add <name>)
│   ├── layout/             # ThemeProvider, Header, Footer, Sidebar
│   ├── shared/             # QueryProvider, ToastProvider, ErrorBoundary
│   ├── product/            # ProductCard, ProductGallery, ProductFilters
│   ├── cart/               # CartDrawer, CartItem, CartSummary
│   ├── navigation/         # Navbar, MobileMenu, CategoryNav
│   └── forms/              # Form fields, FormWrapper, validation
│
├── lib/
│   ├── utils/              # cn(), formatPrice(), slugify(), etc.
│   ├── db/                 # Prisma client singleton
│   ├── auth/               # NextAuth configuration
│   ├── cloudinary/         # Image upload helpers
│   ├── payments/
│   │   ├── stripe.ts       # Stripe SDK + helpers
│   │   └── paymob/         # Paymob integration (placeholder)
│   └── shipping/
│       └── bosta/          # Bosta integration (placeholder)
│
├── hooks/                  # Custom React hooks (use-cart, use-product-filter, etc.)
├── actions/                # Next.js Server Actions (auth, cart, checkout, etc.)
├── services/               # Business logic layer (order.service, email.service, etc.)
├── repositories/           # Data access layer (product.repo, order.repo, etc.)
├── types/                  # TypeScript interfaces and domain types
├── config/                 # Site config, feature flags
├── constants/              # App-wide constants
├── middleware/             # Rate limiting utilities
├── emails/                 # Transactional email templates (Resend + React Email)
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets (images, fonts, manifest)
│
├── middleware.ts           # Next.js middleware (auth route protection)
├── next.config.ts          # Next.js config (security headers, image domains)
├── postcss.config.mjs      # PostCSS (Tailwind)
├── components.json         # shadcn/ui configuration
├── tsconfig.json           # TypeScript (strict mode)
├── eslint.config.mjs       # ESLint (Next.js + TypeScript rules)
├── .prettierrc             # Prettier (formatting)
├── .editorconfig           # Editor config
└── .env.example            # Environment variable template
```

---

## Coding Conventions

### TypeScript
- **No `any` types** — ever. Use `unknown` and type-narrow, or define the proper interface.
- Use `type` for unions/aliases, `interface` for object shapes.
- Use `import type { ... }` for type-only imports.

### Components
- **Server Components by default.** Only add `'use client'` when you need browser APIs, event handlers, or React hooks.
- Keep components small and single-purpose.
- Colocate subcomponents in the same file until they need to be reused.

### Data Fetching
- Fetch data in Server Components using `async/await fetch()` or Prisma directly.
- Use TanStack Query (`useQuery`) for client-side data that needs refetching.
- Use Server Actions for mutations (form submissions, cart updates, etc.).

### Error Handling
- API routes return `{ error: string }` with appropriate HTTP status codes.
- Server Actions return `ActionResult<T>` — never throw to the client.
- Use the `ErrorBoundary` component for section-level error isolation.

### Styling
- Use Tailwind utility classes. Avoid custom CSS unless truly necessary.
- Use the `cn()` utility from `@/lib/utils/cn` for conditional classes.
- All design tokens (colors, spacing, radius) are defined in `app/globals.css`.

### Database
- All DB access goes through the repository layer.
- Business logic goes in services.
- Never call Prisma directly from components or Server Actions — go through `services/`.

---

## Adding shadcn/ui Components

```bash
# From the artifacts/stressnes directory:
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
```

Components are added to `components/ui/`.

---

## Database Commands

```bash
pnpm prisma:push       # Sync schema to DB (dev, no migration file)
pnpm prisma:migrate    # Create and apply a migration file
pnpm prisma:generate   # Regenerate Prisma Client after schema change
pnpm prisma:studio     # Open Prisma Studio (DB GUI)
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.
See `.env.example` for documentation on each variable.

**Required for core functionality:**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000`)

---

## Future Tasks Integration Guide

When starting a new task, follow this checklist:

1. **Database models** → `prisma/schema.prisma` → run `pnpm prisma:migrate`
2. **API endpoints** → Create route handlers in `app/api/<domain>/route.ts`
3. **Server Actions** → `actions/<domain>.ts` with `'use server'`
4. **Repository** → `repositories/<entity>.repository.ts`
5. **Service** → `services/<domain>.service.ts`
6. **Components** → `components/<category>/<ComponentName>.tsx`
7. **Page** → `app/<route>/page.tsx` (Server Component)
8. **Types** → Add to `types/index.ts` or a new `types/<domain>.ts`

Each layer has a README with patterns and examples.
