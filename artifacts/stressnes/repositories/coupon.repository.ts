import { type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const couponRepository = {
  async findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  async findById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  },

  async create(data: Prisma.CouponCreateInput) {
    return prisma.coupon.create({ data });
  },

  async incrementUsage(id: string) {
    return prisma.coupon.update({ where: { id }, data: { usedCount: { increment: 1 } } });
  },

  async getUserUsageCount(couponId: string, userId: string) {
    return prisma.couponUsage.count({ where: { couponId, userId } });
  },

  async recordUsage(couponId: string, userId: string, orderId: string) {
    return prisma.$transaction([
      prisma.couponUsage.create({ data: { couponId, userId, orderId } }),
      prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),
    ]);
  },
};
