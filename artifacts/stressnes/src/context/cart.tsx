import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCart,
  useAddToCart,
  useRemoveFromCart,
  useUpdateCartItem,
  useClearCart,
  getGetCartQueryKey,
  type CartItemInput,
  type Cart,
} from '@workspace/api-client-react';
import { toast } from 'sonner';

// A lightweight, client-only stand-in for the real cart item — set the
// instant "Buy Now" is pressed, so checkout has something real to render
// before the actual add-to-cart request has finished round-tripping.
export interface PendingCheckoutItem {
  id: 'pending';
  quantity: number;
  price: number;
  product: {
    title: string;
    images?: { id: string; url: string }[] | null;
  };
  variant?: { size?: string | null } | null;
}

interface CartContextValue {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
  cartId: string | null;
  isAddingToCart: boolean;
  pendingCheckoutItem: PendingCheckoutItem | null;
  setPendingCheckoutItem: (item: PendingCheckoutItem | null) => void;
    addItem: (
    input: CartItemInput,
    productTitle?: string,
    options?: {
      silent?: boolean;
      // Display data for the item shown in the cart the INSTANT the button
      // is pressed, before the server has confirmed anything.
      optimistic?: { price: number; image?: string | null; variantLabel?: string | null };
    },
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCheckoutItem, setPendingCheckoutItem] = useState<PendingCheckoutItem | null>(null);
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart({ query: { retry: false, staleTime: 30_000 } });
  const addToCartMutation = useAddToCart();
  const removeFromCartMutation = useRemoveFromCart();
  const updateCartItemMutation = useUpdateCartItem();
  const clearCartMutation = useClearCart();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const invalidateCart = useCallback(() =>
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }), [queryClient]);

  const addItem = useCallback(async (
    input: CartItemInput,
    productTitle?: string,
    options?: {
      silent?: boolean;
      optimistic?: { price: number; image?: string | null; variantLabel?: string | null };
    },
  ) => {
    const queryKey = getGetCartQueryKey();
    const previousCart = queryClient.getQueryData<Cart>(queryKey);

    // Write the item into the cart cache RIGHT NOW — every component reading
    // useGetCart (badge count, sidebar, checkout) updates in the same tick,
    // with no network round trip in the way.
    if (options?.optimistic) {
      const { price, image, variantLabel } = options.optimistic;
      queryClient.setQueryData<Cart>(queryKey, (old) => {
        const base = old ?? { id: previousCart?.id ?? 'optimistic-cart', items: [], subtotal: 0 };
        const items = base.items ?? [];
        const existingIdx = items.findIndex(
          (it: any) => it.productId === input.productId && it.variantId === input.variantId,
        );
        const nextItems = existingIdx >= 0
          ? items.map((it: any, i: number) =>
              i === existingIdx ? { ...it, quantity: it.quantity + input.quantity } : it,
            )
          : [
              ...items,
              {
                id: `optimistic-${Date.now()}`,
                productId: input.productId,
                variantId: input.variantId,
                quantity: input.quantity,
                price,
                product: { title: productTitle ?? '', images: image ? [{ id: 'optimistic', url: image }] : [] },
                variant: variantLabel ? { size: variantLabel } : null,
              },
            ];
        const subtotal = nextItems.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
        return { ...base, items: nextItems, subtotal };
      });
    }

    // Instant feedback — nothing below this line is awaited by the caller.
    toast.success(productTitle ? `${productTitle} added to cart` : 'Added to cart');
    if (!options?.silent) setIsOpen(true);

    // Real request runs in the background. Reconciles on success, rolls
    // back the optimistic write and tells the customer on failure.
    addToCartMutation.mutateAsync({ data: input })
      .then(() => {
        void invalidateCart();
      })
      .catch((err) => {
        queryClient.setQueryData(queryKey, previousCart);
        toast.error(
          productTitle ? `Could not add ${productTitle} to bag — please try again` : 'Could not add to bag — please try again',
        );
        console.warn('[cart] addItem failed, rolled back optimistic update:', err);
      });
  }, [addToCartMutation, invalidateCart, queryClient]);

  const removeItem = useCallback(async (itemId: string) => {
    const queryKey = getGetCartQueryKey();
    const previousCart = queryClient.getQueryData<Cart>(queryKey);

    // Drop the item from the screen the instant the trash icon is tapped —
    // no waiting on the network to see it disappear.
    queryClient.setQueryData<Cart>(queryKey, (old) => {
      if (!old) return old;
      const items = (old.items ?? []).filter((it: any) => it.id !== itemId);
      const subtotal = items.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
      return { ...old, items, subtotal };
    });

    removeFromCartMutation.mutateAsync({ itemId })
      .then(() => void invalidateCart())
      .catch((err) => {
        queryClient.setQueryData(queryKey, previousCart);
        toast.error('Could not remove item — please try again');
        console.warn('[cart] removeItem failed, rolled back optimistic update:', err);
      });
  }, [removeFromCartMutation, invalidateCart, queryClient]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    const queryKey = getGetCartQueryKey();
    const previousCart = queryClient.getQueryData<Cart>(queryKey);

    // Update the number on screen the instant +/- is tapped — no waiting
    // on the network to see it change.
    queryClient.setQueryData<Cart>(queryKey, (old) => {
      if (!old) return old;
      const items = (old.items ?? []).map((it: any) =>
        it.id === itemId ? { ...it, quantity } : it,
      );
      const subtotal = items.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
      return { ...old, items, subtotal };
    });

    updateCartItemMutation.mutateAsync({ itemId, data: { quantity } })
      .then(() => void invalidateCart())
      .catch((err) => {
        queryClient.setQueryData(queryKey, previousCart);
        toast.error('Could not update quantity — please try again');
        console.warn('[cart] updateQuantity failed, rolled back optimistic update:', err);
      });
  }, [updateCartItemMutation, invalidateCart, queryClient]);

  const clearCart = useCallback(async () => {
    await clearCartMutation.mutateAsync();
    await invalidateCart();
    setPendingCheckoutItem(null);
  }, [clearCartMutation, invalidateCart]);

  // Once the real cart actually contains items, the optimistic placeholder
  // has served its purpose — drop it so we never show both at once.
  useEffect(() => {
    if (cart?.items && cart.items.length > 0 && pendingCheckoutItem) {
      setPendingCheckoutItem(null);
    }
  }, [cart?.items, pendingCheckoutItem]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const cartId = cart?.id ?? null;

  return (
    <CartContext.Provider
      value={{
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        itemCount,
        cartId,
        isAddingToCart: addToCartMutation.isPending,
        pendingCheckoutItem,
        setPendingCheckoutItem,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
