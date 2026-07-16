import { z } from 'zod';
import { OrderStatus, PaymentProvider, ShippingCarrier } from '@prisma/client';

const AddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default('EG'),
  phone: z.string().max(20).optional(),
});

export const CreateOrderSchema = z.object({
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  shippingMethod: z.string().optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  paymentProvider: z.nativeEnum(PaymentProvider),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().max(255).optional(),
  shippingCarrier: z.nativeEnum(ShippingCarrier).optional(),
  cancelledReason: z.string().max(500).optional(),
});

export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().uuid().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
