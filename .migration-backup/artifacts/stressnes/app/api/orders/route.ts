import { type NextRequest } from 'next/server';
import { orderService } from '@/services/order.service';
import { OrderListQuerySchema, CreateOrderSchema } from '@/lib/validations/order';
import { created, badRequest, serverError, paginated, parseBody } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const user = auth.session.user as { id: string; role?: string };
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = OrderListQuerySchema.safeParse(params);
    if (!result.success) return badRequest('Invalid query parameters', result.error.format());

    // Customers can only see their own orders; admins can see all
    const userId = user.role === 'ADMIN' ? result.data.userId : user.id;
    const { data, total } = await orderService.list(result.data, userId);
    return paginated(data, total, result.data.page, result.data.pageSize);
  } catch (error) {
    console.error('[GET /api/orders]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const user = auth.session.user as { id: string };
    const parsed = await parseBody(request, CreateOrderSchema);
    if ('error' in parsed) return parsed.error;

    // Cart ID must come from the session/cookie — expect it as a query param
    const cartId = request.nextUrl.searchParams.get('cartId');
    if (!cartId) return badRequest('cartId is required');

    const order = await orderService.createFromCart(user.id, cartId, parsed.data);
    return created(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('[POST /api/orders]', error);
    if (message === 'Cart is empty') return badRequest(message);
    return serverError(message);
  }
}
