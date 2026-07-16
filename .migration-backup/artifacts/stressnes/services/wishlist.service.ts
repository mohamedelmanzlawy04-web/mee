import { wishlistRepository } from '@/repositories/wishlist.repository';

export const wishlistService = {
  async getOrCreate(userId: string) {
    return (
      (await wishlistRepository.findByUserId(userId)) ??
      (await wishlistRepository.createForUser(userId))
    );
  },

  async addItem(userId: string, productId: string, variantId?: string | null) {
    const wishlist = await this.getOrCreate(userId);
    const alreadyAdded = await wishlistRepository.hasItem(wishlist.id, productId, variantId);
    if (alreadyAdded) throw new Error('Item already in wishlist');
    return wishlistRepository.addItem(wishlist.id, productId, variantId);
  },

  async removeItem(userId: string, itemId: string) {
    const item = await wishlistRepository.findItemById(itemId);
    if (!item) throw new Error('Item not found');

    const wishlist = await wishlistRepository.findByUserId(userId);
    if (!wishlist || item.wishlistId !== wishlist.id) throw new Error('Forbidden');

    return wishlistRepository.removeItem(itemId);
  },

  async get(userId: string) {
    return this.getOrCreate(userId);
  },
};
