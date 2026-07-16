import { couponRepository } from '@/repositories/coupon.repository';
import type { ValidateCouponInput, CreateCouponInput } from '@/lib/validations/coupon';

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  discountAmount: number;
  message?: string;
}

export const couponService = {
  async validate(input: ValidateCouponInput, userId?: string): Promise<CouponValidationResult> {
    const coupon = await couponRepository.findByCode(input.code);

    if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code' };
    if (!coupon.isActive) return { valid: false, discountAmount: 0, message: 'Coupon is no longer active' };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, discountAmount: 0, message: 'Coupon has expired' };
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'Coupon usage limit reached' };
    }
    if (coupon.minSpend && input.orderSubtotal < Number(coupon.minSpend)) {
      return { valid: false, discountAmount: 0, message: `Minimum spend of ${coupon.minSpend} required` };
    }

    if (userId) {
      const userUsage = await couponRepository.getUserUsageCount(coupon.id, userId);
      if (userUsage >= coupon.perUserLimit) {
        return { valid: false, discountAmount: 0, message: 'You have already used this coupon' };
      }
    }

    let discountAmount: number;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (input.orderSubtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      discountAmount = Math.min(Number(coupon.value), input.orderSubtotal);
    }

    return { valid: true, couponId: coupon.id, discountAmount };
  },

  async create(input: CreateCouponInput) {
    return couponRepository.create({ ...input, value: input.value });
  },
};
