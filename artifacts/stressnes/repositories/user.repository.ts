import { type Prisma, type UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  },

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
    });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  async findMany(args: { page: number; pageSize: number; role?: UserRole; search?: string }) {
    const { page, pageSize, role, search } = args;
    const skip = (page - 1) * pageSize;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, phone: true, role: true, emailVerified: true, avatar: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  },

  async softDelete(id: string) {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async getAddresses(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
  },

  async createAddress(data: Prisma.AddressCreateInput) {
    return prisma.address.create({ data });
  },
};
