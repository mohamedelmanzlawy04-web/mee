import { type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const productRepository = {
  async findMany(args: {
    page: number;
    pageSize: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    const { page, pageSize, where, orderBy } = args;
    const skip = (page - 1) * pageSize;
    const baseWhere: Prisma.ProductWhereInput = { deletedAt: null, ...where };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where: baseWhere,
        skip,
        take: pageSize,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          collection: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true, variants: true } },
        },
      }),
      prisma.product.count({ where: baseWhere }),
    ]);
    return { data, total };
  },

  async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true }, include: { inventory: true } },
        category: true,
        subCategory: true,
        collection: true,
        tags: true,
        reviews: {
          where: { status: 'APPROVED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { fullName: true, avatar: true } }, images: true },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.product.findFirst({ where: { id, deletedAt: null } });
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async findByIds(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null, published: true },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    });
  },
};
