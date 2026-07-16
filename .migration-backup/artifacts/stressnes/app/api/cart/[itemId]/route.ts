import { type NextRequest } from 'next/server';
import { cartService } from '@/services/cart.service';
import { UpdateCartItemSchema } from '@/lib/validations/cart';
import { ok, serverError, parseBody } from '@/lib/api/response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const parsed = await parseBody(request, UpdateCartItemSchema);
    if ('error' in parsed) return parsed.error;

    await cartService.updateItem(itemId, parsed.data);
    return ok({ success: true });
  } catch (error) {
    console.error('[PATCH /api/cart/[itemId]]', error);
    return serverError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    await cartService.removeItem(itemId);
    return ok({ success: true });
  } catch (error) {
    console.error('[DELETE /api/cart/[itemId]]', error);
    return serverError();
  }
}
