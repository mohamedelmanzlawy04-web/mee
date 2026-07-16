# actions/

Next.js Server Actions for STRESSNES.

Server Actions run on the server and can be called directly from Client or Server Components.
They replace traditional API routes for simple mutations.

## Rules

1. Always mark with `'use server'` at the top of the file
2. Validate all inputs with Zod before processing
3. Return a typed result (`ActionResult<T>`) — never throw directly to the client
4. Use `revalidatePath()` or `revalidateTag()` to invalidate affected cache

## Standard Result Type

```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

## Planned Actions

| File | Actions |
|---|---|
| `actions/auth.ts` | `loginAction`, `registerAction`, `logoutAction` |
| `actions/cart.ts` | `addToCartAction`, `removeFromCartAction`, `updateCartAction` |
| `actions/checkout.ts` | `createOrderAction`, `initiatePaymentAction` |
| `actions/wishlist.ts` | `toggleWishlistAction` |
| `actions/product.ts` | `(admin) createProductAction`, `updateProductAction` |
| `actions/account.ts` | `updateProfileAction`, `updatePasswordAction` |

## Example

```ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

const schema = z.object({ productId: z.string(), quantity: z.number().min(1) });

export async function addToCartAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ cartId: string }>> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: 'Invalid input', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  // ... add to cart ...
  revalidatePath('/cart');
  return { success: true, data: { cartId: '...' } };
}
```
