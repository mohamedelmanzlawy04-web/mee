import { type InventoryChangeReason } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const inventoryRepository = {
  async findByVariantId(variantId: string) {
    return prisma.inventory.findUnique({ where: { variantId } });
  },

  async upsert(variantId: string, currentStock: number) {
    return prisma.inventory.upsert({
      where: { variantId },
      update: { currentStock },
      create: { variantId, currentStock },
    });
  },

  async adjustStock(
    variantId: string,
    change: number,
    reason: InventoryChangeReason,
    note?: string,
    orderId?: string,
  ) {
    const inventory = await prisma.inventory.findUniqueOrThrow({ where: { variantId } });
    const previousStock = inventory.currentStock;
    const newStock = previousStock + change;

    if (newStock < 0) throw new Error('Insufficient stock');

    return prisma.$transaction([
      prisma.inventory.update({
        where: { variantId },
        data: { currentStock: newStock },
      }),
      prisma.inventoryHistory.create({
        data: { inventoryId: inventory.id, change, reason, previousStock, newStock, note, orderId },
      }),
    ]);
  },

  async reserveStock(variantId: string, quantity: number) {
    return prisma.inventory.update({
      where: { variantId },
      data: { reservedStock: { increment: quantity } },
    });
  },

  async releaseReservation(variantId: string, quantity: number) {
    return prisma.inventory.update({
      where: { variantId },
      data: { reservedStock: { decrement: quantity } },
    });
  },

  async getLowStock(threshold?: number) {
    return prisma.inventory.findMany({
      where: { trackInventory: true, currentStock: { lte: threshold ?? 5 } },
      include: { variant: { include: { product: { select: { title: true, slug: true } } } } },
    });
  },

  async getHistory(variantId: string, limit = 20) {
    const inventory = await prisma.inventory.findUnique({ where: { variantId } });
    if (!inventory) return [];
    return prisma.inventoryHistory.findMany({
      where: { inventoryId: inventory.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
