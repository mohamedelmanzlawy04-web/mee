import { z } from 'zod';
import { CouponType } from '@prisma/client';

export const ValidateCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  orderSubtotal: z.number().positive(),
});

export const CreateCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minSpend: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional(),
});

export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
