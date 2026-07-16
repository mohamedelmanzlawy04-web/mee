import { type PaymentProvider, type PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const paymentService = {
  async createPayment(orderId: string, provider: PaymentProvider, amount: number, currency = 'EGP') {
    return prisma.payment.create({
      data: { orderId, provider, amount, currency, status: 'PENDING' },
    });
  },

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
    gatewayResponse?: Record<string, unknown>,
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId,
        gatewayResponse: gatewayResponse !== undefined ? (gatewayResponse as Prisma.InputJsonValue) : Prisma.JsonNull,
        paidAt: status === 'CAPTURED' ? new Date() : undefined,
      },
    });
  },

  async recordTransaction(
    paymentId: string,
    type: 'CHARGE' | 'REFUND' | 'PARTIAL_REFUND',
    amount: number,
    status: PaymentStatus,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.transaction.create({
      data: { paymentId, type, amount, status, metadata: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull },
    });
  },

  /** Verify a Paymob webhook HMAC signature */
  verifyPaymobWebhook(payload: Record<string, string>, hmac: string): boolean {
    // TODO: Implement HMAC-SHA512 verification using PAYMOB_API_KEY
    // This is a placeholder that returns false until implemented
    void payload;
    void hmac;
    return false;
  },

  /** Verify a Stripe webhook signature */
  verifyStripeWebhook(payload: string | Buffer, signature: string): boolean {
    // Delegate to stripe.ts constructWebhookEvent in the real implementation
    void payload;
    void signature;
    return false;
  },
};
