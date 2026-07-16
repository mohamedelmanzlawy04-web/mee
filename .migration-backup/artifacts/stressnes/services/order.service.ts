import { orderRepository } from '@/repositories/order.repository';
import { cartRepository } from '@/repositories/cart.repository';
import { couponRepository } from '@/repositories/coupon.repository';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { generateOrderNumber } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import type { CreateOrderInput, UpdateOrderStatusInput, OrderListQuery } from '@/lib/validations/order';
import { prisma } from '@/lib/db/prisma';

export const orderService = {
  async list(query: OrderListQuery, userId?: string) {
    return orderRepository.findMany({
      page: query.page,
      pageSize: query.pageSize,
      userId,
      status: query.status,
    });
  },

  async getById(id: string) {
    return orderRepository.findById(id);
  },

  async createFromCart(userId: string, cartId: string, input: CreateOrderInput) {
    const cart = await cartRepository.findById(cartId);
    if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

    // Calculate totals
    let subtotal = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    let discountAmount = 0;
    let couponId: string | undefined;

    // Apply coupon
    if (input.couponCode) {
      const coupon = await couponRepository.findByCode(input.couponCode);
      if (coupon) {
        couponId = coupon.id;
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
        } else {
          discountAmount = Math.min(Number(coupon.value), subtotal);
        }
      }
    }

    const shippingCost = 0; // TODO: calculate from shipping service
    const taxAmount = 0;
    const total = Math.max(0, subtotal - discountAmount + shippingCost + taxAmount);
    const orderNumber = generateOrderNumber();

    // Build order items from cart
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.title,
      variantSnapshot: item.variant
        ? { sku: item.variant.sku, size: item.variant.size, color: item.variant.color, material: item.variant.material }
        : Prisma.JsonNull,
      unitPrice: Number(item.price),
      quantity: item.quantity,
      discountAmount: 0,
      total: Number(item.price) * item.quantity,
      productImage: item.product.images[0]?.url ?? null,
    }));

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          discountAmount,
          taxAmount,
          shippingCost,
          total,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress ?? input.shippingAddress,
          couponId,
          couponCode: input.couponCode,
          notes: input.notes,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Reserve inventory
      for (const item of cart.items) {
        if (item.variantId) {
          await inventoryRepository.reserveStock(item.variantId, item.quantity);
        }
      }

      // Record coupon usage
      if (couponId) {
        await tx.couponUsage.create({ data: { couponId, userId, orderId: newOrder.id } });
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      return newOrder;
    });

    // Clear the cart after successful order
    await cartRepository.clearCart(cartId);

    return order;
  },

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    return orderRepository.updateStatus(id, input);
  },
};
