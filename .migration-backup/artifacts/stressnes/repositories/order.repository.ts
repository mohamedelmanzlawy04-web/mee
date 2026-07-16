import { type Prisma, type OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const orderRepository = {
  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: { items: true, payments: true },
    });
  },

  async findById(id: string) {
    return prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        payments: { include: { transactions: true } },
        couponUsages: true,
      },
    });
  },

  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findFirst({ where: { orderNumber, deletedAt: null } });
  },

  async findMany(args: {
    page: number;
    pageSize: number;
    userId?: string;
    status?: OrderStatus;
  }) {
    const { page, pageSize, userId, status } = args;
    const skip = (page - 1) * pageSize;
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: { take: 3 } },
      }),
      prisma.order.count({ where }),
    ]);
    return { data, total };
  },

  async updateStatus(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
