import { type NextRequest } from 'next/server';
import { wishlistService } from '@/services/wishlist.service';
import { ok, serverError } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const userId = (auth.session.user as { id: string }).id;
    const { itemId } = await params;
    await wishlistService.removeItem(userId, itemId);
    return ok({ success: true });
  } catch (error: unknown) {
    console.error('[DELETE /api/wishlist/[itemId]]', error);
    return serverError(error instanceof Error ? error.message : undefined);
  }
}
