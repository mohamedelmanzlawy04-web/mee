# repositories/

Data access layer for STRESSNES.

Repositories abstract all database queries behind typed interfaces.
They ONLY interact with Prisma — no business logic, no HTTP, no emails.

## Architecture Rule

- Repository methods return plain domain objects (or Prisma types)
- No service logic, no validation beyond what Prisma enforces
- One repository per domain entity

## Naming Convention

Files: `repositories/<entity>.repository.ts`
Export a singleton object with methods.

## Planned Repositories

| File | Entity |
|---|---|
| `repositories/user.repository.ts` | User |
| `repositories/product.repository.ts` | Product, ProductVariant |
| `repositories/category.repository.ts` | Category |
| `repositories/order.repository.ts` | Order, OrderItem |
| `repositories/cart.repository.ts` | Cart, CartItem |
| `repositories/address.repository.ts` | Address |
| `repositories/coupon.repository.ts` | Coupon |
| `repositories/review.repository.ts` | Review |
| `repositories/wishlist.repository.ts` | Wishlist |

## Example

```ts
// repositories/product.repository.ts

import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const productRepository = {
  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: { images: true, variants: true, category: true },
    });
  },

  async findMany(args?: Prisma.ProductFindManyArgs) {
    return prisma.product.findMany(args);
  },
};
```
