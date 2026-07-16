import { inventoryRepository } from '@/repositories/inventory.repository';
import type { AdjustInventoryInput, UpdateInventorySettingsInput } from '@/lib/validations/inventory';
import { prisma } from '@/lib/db/prisma';

export const inventoryService = {
  async getByVariantId(variantId: string) {
    return inventoryRepository.findByVariantId(variantId);
  },

  async adjust(variantId: string, input: AdjustInventoryInput) {
    return inventoryRepository.adjustStock(
      variantId,
      input.change,
      input.reason,
      input.note,
    );
  },

  async updateSettings(variantId: string, input: UpdateInventorySettingsInput) {
    const existing = await inventoryRepository.findByVariantId(variantId);
    if (!existing) {
      return inventoryRepository.upsert(variantId, 0);
    }
    return prisma.inventory.update({
      where: { variantId },
      data: input,
    });
  },

  async getHistory(variantId: string) {
    return inventoryRepository.getHistory(variantId);
  },

  async getLowStock() {
    return inventoryRepository.getLowStock();
  },

  /** Check if enough stock is available to fulfill a quantity */
  async isAvailable(variantId: string, quantity: number): Promise<boolean> {
    const inv = await inventoryRepository.findByVariantId(variantId);
    if (!inv || !inv.trackInventory) return true;
    const available = inv.currentStock - inv.reservedStock;
    return available >= quantity;
  },
};
