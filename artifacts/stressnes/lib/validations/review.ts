import { z } from 'zod';

export const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const UpdateReviewStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const ReviewListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  productId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;
