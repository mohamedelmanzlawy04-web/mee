import { type NextRequest } from 'next/server';
import { couponService } from '@/services/coupon.service';
import { CreateCouponSchema } from '@/lib/validations/coupon';
import { created, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const parsed = await parseBody(request, CreateCouponSchema);
    if ('error' in parsed) return parsed.error;

    const coupon = await couponService.create(parsed.data);
    return created(coupon);
  } catch (error) {
    console.error('[POST /api/coupons]', error);
    return serverError();
  }
}
