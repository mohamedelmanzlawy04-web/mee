# hooks/

Custom React hooks for STRESSNES.

## Naming Convention

All hooks must:
- Start with `use` (e.g., `useCart`, `useProduct`, `useCheckout`)
- Live in their own file: `hooks/use-<name>.ts`
- Be Client-side only (Server Components cannot use hooks)

## Planned Hooks

| File | Purpose |
|---|---|
| `use-cart.ts` | Cart state, add/remove/update items |
| `use-wishlist.ts` | Wishlist toggle and persistence |
| `use-checkout.ts` | Checkout flow state machine |
| `use-product-filter.ts` | Product listing filters and URL sync |
| `use-infinite-products.ts` | Infinite scroll product loading |
| `use-media-query.ts` | Responsive breakpoint detection |
| `use-debounce.ts` | Debounced value for search inputs |
| `use-local-storage.ts` | Type-safe localStorage wrapper |
| `use-auth.ts` | Auth session helpers |
| `use-toast.ts` | Sonner toast shorthand helpers |

## Example

```ts
import { useCart } from '@/hooks/use-cart';

const { items, addItem, removeItem, total } = useCart();
```
