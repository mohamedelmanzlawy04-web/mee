import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().max(99),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(99),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
