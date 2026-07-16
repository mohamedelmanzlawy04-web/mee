import { type Prisma, type ReviewStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const reviewRepository = {
  async findMany(args: {
    page: number;
    pageSize: number;
    productId?: string;
    status?: ReviewStatus;
    rating?: number;
  }) {
    const { page, pageSize, productId, status, rating } = args;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ReviewWhereInput = {
      ...(productId ? { productId } : {}),
      ...(status ? { status } : {}),
      ...(rating ? { rating } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatar: true } },
          images: true,
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { data, total };
  },

  async findById(id: string) {
    return prisma.review.findUnique({ where: { id }, include: { images: true } });
  },

  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data });
  },

  async updateStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({ where: { id }, data: { status } });
  },

  async getProductStats(productId: string) {
    return prisma.review.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });
  },

  async hasUserReviewed(userId: string, productId: string) {
    const review = await prisma.review.findFirst({ where: { userId, productId } });
    return !!review;
  },
};
