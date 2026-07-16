import { type NextRequest } from 'next/server';
import { couponService } from '@/services/coupon.service';
import { ValidateCouponSchema } from '@/lib/validations/coupon';
import { ok, serverError, parseBody } from '@/lib/api/response';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, ValidateCouponSchema);
    if ('error' in parsed) return parsed.error;

    const session = await auth();
    const userId = session?.user ? (session.user as { id: string }).id : undefined;

    const result = await couponService.validate(parsed.data, userId);
    return ok(result);
  } catch (error) {
    console.error('[POST /api/coupons/validate]', error);
    return serverError();
  }
}
