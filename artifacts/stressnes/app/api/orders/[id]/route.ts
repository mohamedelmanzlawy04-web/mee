import { type NextRequest } from 'next/server';
import { orderService } from '@/services/order.service';
import { ok, notFound, forbidden, serverError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const order = await orderService.getById(id);
    if (!order) return notFound('Order not found');

    const user = auth.session.user as { id: string; role?: string };
    if (user.role !== 'ADMIN' && order.userId !== user.id) return forbidden();

    return ok(order);
  } catch (error) {
    console.error('[GET /api/orders/[id]]', error);
    return serverError();
  }
}
