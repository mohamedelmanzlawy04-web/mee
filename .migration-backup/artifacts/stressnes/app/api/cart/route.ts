import { type NextRequest } from 'next/server';
import { cartService } from '@/services/cart.service';
import { AddToCartSchema } from '@/lib/validations/cart';
import { ok, created, serverError, parseBody } from '@/lib/api/response';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

const GUEST_CART_COOKIE = 'guestCartSession';

async function resolveCart() {
  const session = await auth();
  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    return cartService.getOrCreateForUser(userId);
  }

  const cookieStore = await cookies();
  let sessionId = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // Note: we can't set cookies inside GET — the caller should handle this
  }
  return cartService.getOrCreateForSession(sessionId);
}

export async function GET() {
  try {
    const cart = await resolveCart();
    return ok(cart);
  } catch (error) {
    console.error('[GET /api/cart]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const cart = await resolveCart();
    const parsed = await parseBody(request, AddToCartSchema);
    if ('error' in parsed) return parsed.error;

    await cartService.addItem(cart.id, parsed.data);
    const updated = await resolveCart();
    return created(updated);
  } catch (error: unknown) {
    console.error('[POST /api/cart]', error);
    return serverError(error instanceof Error ? error.message : undefined);
  }
}

export async function DELETE() {
  try {
    const cart = await resolveCart();
    await cartService.clearCart(cart.id);
    return ok({ success: true });
  } catch (error) {
    console.error('[DELETE /api/cart]', error);
    return serverError();
  }
}
