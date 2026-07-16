import { type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      variant: true,
    },
  },
} satisfies Prisma.CartInclude;

export const cartRepository = {
  async findByUserId(userId: string) {
    return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  },

  async findBySessionId(sessionId: string) {
    return prisma.cart.findUnique({ where: { sessionId }, include: cartInclude });
  },

  async findById(id: string) {
    return prisma.cart.findUnique({ where: { id }, include: cartInclude });
  },

  async createForUser(userId: string) {
    return prisma.cart.create({ data: { userId }, include: cartInclude });
  },

  async createForSession(sessionId: string) {
    return prisma.cart.create({ data: { sessionId }, include: cartInclude });
  },

  async upsertItem(data: {
    cartId: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    price: number;
  }) {
    const { cartId, productId, variantId, quantity, price } = data;
    return prisma.cartItem.upsert({
      where: { cartId_productId_variantId: { cartId, productId, variantId: variantId ?? '' } },
      update: { quantity, price },
      create: { cartId, productId, variantId, quantity, price },
    });
  },

  async updateItem(itemId: string, quantity: number) {
    return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  },

  async removeItem(itemId: string) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  },

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },

  async deleteCart(id: string) {
    return prisma.cart.delete({ where: { id } });
  },
};
