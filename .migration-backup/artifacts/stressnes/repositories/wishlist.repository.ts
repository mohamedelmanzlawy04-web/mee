import { prisma } from '@/lib/db/prisma';

const wishlistInclude = {
  items: {
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      variant: true,
    },
    orderBy: { addedAt: 'desc' as const },
  },
};

export const wishlistRepository = {
  async findByUserId(userId: string) {
    return prisma.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
  },

  async createForUser(userId: string) {
    return prisma.wishlist.create({ data: { userId }, include: wishlistInclude });
  },

  async addItem(wishlistId: string, productId: string, variantId?: string | null) {
    return prisma.wishlistItem.create({ data: { wishlistId, productId, variantId } });
  },

  async removeItem(itemId: string) {
    return prisma.wishlistItem.delete({ where: { id: itemId } });
  },

  async hasItem(wishlistId: string, productId: string, variantId?: string | null) {
    const item = await prisma.wishlistItem.findUnique({
      where: { wishlistId_productId_variantId: { wishlistId, productId, variantId: variantId ?? '' } },
    });
    return !!item;
  },

  async findItemById(itemId: string) {
    return prisma.wishlistItem.findUnique({ where: { id: itemId } });
  },
};
