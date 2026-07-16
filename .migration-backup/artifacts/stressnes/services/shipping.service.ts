import { type ShippingCarrier } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface ShippingQuote {
  methodId: string;
  name: string;
  carrier: ShippingCarrier;
  price: number;
  estimatedDays: number;
}

export const shippingService = {
  async getActiveMethods(): Promise<ShippingQuote[]> {
    const methods = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return methods.map((m) => ({
      methodId: m.id,
      name: m.name,
      carrier: m.carrier,
      price: Number(m.price),
      estimatedDays: m.estimatedDays,
    }));
  },

  async getMethodById(id: string) {
    return prisma.shippingMethod.findUnique({ where: { id } });
  },

  /**
   * Calculate shipping cost for an order.
   * Returns 0 (free shipping) if order total exceeds minOrderAmount.
   */
  async calculateCost(methodId: string, orderSubtotal: number): Promise<number> {
    const method = await prisma.shippingMethod.findUnique({ where: { id: methodId } });
    if (!method) throw new Error('Shipping method not found');
    if (method.minOrderAmount && orderSubtotal >= Number(method.minOrderAmount)) return 0;
    return Number(method.price);
  },

  /** Placeholder: create a Bosta shipment */
  async createBostaShipment(_orderId: string, _trackingData: unknown): Promise<string> {
    // TODO: integrate with Bosta API (lib/shipping/bosta/)
    throw new Error('Bosta integration not yet implemented');
  },

  /** Placeholder: get tracking info from carrier */
  async getTrackingInfo(trackingNumber: string, carrier: ShippingCarrier): Promise<unknown> {
    void trackingNumber;
    void carrier;
    // TODO: integrate with respective carrier APIs
    throw new Error(`Tracking for ${carrier} not yet implemented`);
  },
};
