# services/

Business logic services for STRESSNES.

Services contain domain logic that orchestrates multiple repositories,
sends emails, triggers external APIs, and enforces business rules.
They are framework-agnostic — no Next.js or HTTP specifics here.

## Architecture Rule

```
Route Handler / Server Action
         ↓
      Service         ← Business logic lives here
         ↓
    Repository        ← Database access only
         ↓
      Prisma
```

## Naming Convention

Files: `services/<domain>.service.ts`
Classes or plain objects with methods — choose consistency within a domain.

## Planned Services

| File | Responsibilities |
|---|---|
| `services/auth.service.ts` | Registration, password hashing, session management |
| `services/product.service.ts` | Product search, filtering, stock checks |
| `services/cart.service.ts` | Cart validation, stock reservation |
| `services/order.service.ts` | Order creation, status transitions |
| `services/payment.service.ts` | Payment provider orchestration (Paymob / Stripe) |
| `services/shipping.service.ts` | Shipment creation, tracking (Bosta) |
| `services/email.service.ts` | Transactional emails via Resend |
| `services/inventory.service.ts` | Stock level management |
| `services/coupon.service.ts` | Coupon validation and application |
| `services/search.service.ts` | Full-text product search |

## Example

```ts
// services/order.service.ts

import { orderRepository } from '@/repositories/order.repository';
import { emailService } from '@/services/email.service';
import type { CreateOrderInput } from '@/types';

export const orderService = {
  async create(input: CreateOrderInput) {
    const order = await orderRepository.create(input);
    await emailService.sendOrderConfirmation(order);
    return order;
  },
};
```
