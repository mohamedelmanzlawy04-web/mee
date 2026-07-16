import { cartRepository } from '@/repositories/cart.repository';
import { productRepository } from '@/repositories/product.repository';
import type { AddToCartInput, UpdateCartItemInput } from '@/lib/validations/cart';
import { prisma } from '@/lib/db/prisma';

export const cartService = {
  async getOrCreateForUser(userId: string) {
    return (
      (await cartRepository.findByUserId(userId)) ??
      (await cartRepository.createForUser(userId))
    );
  },

  async getOrCreateForSession(sessionId: string) {
    return (
      (await cartRepository.findBySessionId(sessionId)) ??
      (await cartRepository.createForSession(sessionId))
    );
  },

  async addItem(cartId: string, input: AddToCartInput) {
    // Resolve the price at the time of adding
    const [products] = await productRepository.findByIds([input.productId]);
    if (!products) throw new Error('Product not found');

    let price = Number(products.price);
    if (input.variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: input.variantId } });
      if (variant?.priceOverride) price = Number(variant.priceOverride);
    }

    return cartRepository.upsertItem({
      cartId,
      productId: input.productId,
      variantId: input.variantId ?? null,
      quantity: input.quantity,
      price,
    });
  },

  async updateItem(itemId: string, input: UpdateCartItemInput) {
    return cartRepository.updateItem(itemId, input.quantity);
  },

  async removeItem(itemId: string) {
    return cartRepository.removeItem(itemId);
  },

  async clearCart(cartId: string) {
    return cartRepository.clearCart(cartId);
  },

  /** Calculate cart totals */
  async getCartTotals(cartId: string) {
    const cart = await cartRepository.findById(cartId);
    if (!cart) throw new Error('Cart not found');

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
    return { subtotal, itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) };
  },
};
