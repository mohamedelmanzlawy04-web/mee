import { type NextRequest } from 'next/server';
import { wishlistService } from '@/services/wishlist.service';
import { z } from 'zod';
import { ok, created, serverError, conflict, parseBody } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

const AddToWishlistSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const userId = (auth.session.user as { id: string }).id;
    const wishlist = await wishlistService.get(userId);
    return ok(wishlist);
  } catch (error) {
    console.error('[GET /api/wishlist]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const userId = (auth.session.user as { id: string }).id;
    const parsed = await parseBody(request, AddToWishlistSchema);
    if ('error' in parsed) return parsed.error;

    try {
      const item = await wishlistService.addItem(userId, parsed.data.productId, parsed.data.variantId);
      return created(item);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Item already in wishlist') {
        return conflict(err.message);
      }
      throw err;
    }
  } catch (error) {
    console.error('[POST /api/wishlist]', error);
    return serverError();
  }
}
