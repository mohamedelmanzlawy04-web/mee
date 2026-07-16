import { type NextRequest } from 'next/server';
import { orderService } from '@/services/order.service';
import { UpdateOrderStatusSchema } from '@/lib/validations/order';
import { ok, notFound, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const existing = await orderService.getById(id);
    if (!existing) return notFound('Order not found');

    const parsed = await parseBody(request, UpdateOrderStatusSchema);
    if ('error' in parsed) return parsed.error;

    const order = await orderService.updateStatus(id, parsed.data);
    return ok(order);
  } catch (error) {
    console.error('[PATCH /api/orders/[id]/status]', error);
    return serverError();
  }
}
