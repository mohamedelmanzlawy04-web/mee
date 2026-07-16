import { type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const collectionRepository = {
  async findAll() {
    return prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },

  async findBySlug(slug: string) {
    return prisma.collection.findUnique({ where: { slug } });
  },

  async findById(id: string) {
    return prisma.collection.findUnique({ where: { id } });
  },

  async create(data: Prisma.CollectionCreateInput) {
    return prisma.collection.create({ data });
  },

  async update(id: string, data: Prisma.CollectionUpdateInput) {
    return prisma.collection.update({ where: { id }, data });
  },
};
