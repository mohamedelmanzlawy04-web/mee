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
  addItem: (input: CartItemInput, productTitle?: string, options?: { silent?: boolean }) => Promise<void>;
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

  const addItem = useCallback(async (input: CartItemInput, productTitle?: string, options?: { silent?: boolean }) => {
    await addToCartMutation.mutateAsync({ data: input });
    // Fire-and-forget — don't block on the refetch; the mutation response already updated the server state
    void invalidateCart();
    toast.success(productTitle ? `${productTitle} added to cart` : 'Added to cart');
    if (!options?.silent) setIsOpen(true);
  }, [addToCartMutation, invalidateCart]);

  const removeItem = useCallback(async (itemId: string) => {
    await removeFromCartMutation.mutateAsync({ itemId });
    await invalidateCart();
  }, [removeFromCartMutation, invalidateCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await updateCartItemMutation.mutateAsync({ itemId, data: { quantity } });
    await invalidateCart();
  }, [updateCartItemMutation, invalidateCart]);

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
