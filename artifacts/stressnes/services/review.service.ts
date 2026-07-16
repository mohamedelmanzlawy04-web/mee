import { reviewRepository } from '@/repositories/review.repository';
import type { CreateReviewInput, ReviewListQuery } from '@/lib/validations/review';
import { prisma } from '@/lib/db/prisma';

export const reviewService = {
  async list(query: ReviewListQuery) {
    return reviewRepository.findMany(query);
  },

  async create(userId: string, input: CreateReviewInput) {
    const alreadyReviewed = await reviewRepository.hasUserReviewed(userId, input.productId);
    if (alreadyReviewed) throw new Error('You have already reviewed this product');

    // Check verified purchase if orderId provided
    let verifiedPurchase = false;
    if (input.orderId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: { orderId: input.orderId, productId: input.productId },
      });
      const order = await prisma.order.findFirst({
        where: { id: input.orderId, userId },
      });
      verifiedPurchase = !!(orderItem && order);
    }

    return reviewRepository.create({
      rating: input.rating,
      comment: input.comment,
      verifiedPurchase,
      user: { connect: { id: userId } },
      product: { connect: { id: input.productId } },
      ...(input.orderId ? { orderId: input.orderId } : {}),
    });
  },

  async approve(id: string) {
    return reviewRepository.updateStatus(id, 'APPROVED');
  },

  async reject(id: string) {
    return reviewRepository.updateStatus(id, 'REJECTED');
  },

  async getProductStats(productId: string) {
    return reviewRepository.getProductStats(productId);
  },
};
