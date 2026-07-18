import React, { createContext, useContext, useState, useCallback } from 'react';
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

interface CartContextValue {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
  cartId: string | null;
  addItem: (input: CartItemInput, productTitle?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const addItem = useCallback(async (input: CartItemInput, productTitle?: string) => {
    await addToCartMutation.mutateAsync({ data: input });
    await invalidateCart();
    toast.success(productTitle ? `${productTitle} added to cart` : 'Added to cart');
    setIsOpen(true);
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
  }, [clearCartMutation, invalidateCart]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const cartId = cart?.id ?? null;

  return (
    <CartContext.Provider
      value={{ isOpen, openCart, closeCart, toggleCart, itemCount, cartId, addItem, removeItem, updateQuantity, clearCart }}
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
