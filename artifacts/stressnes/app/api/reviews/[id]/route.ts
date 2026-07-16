import { type NextRequest } from 'next/server';
import { reviewService } from '@/services/review.service';
import { z } from 'zod';
import { ok, serverError, parseBody } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const UpdateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const parsed = await parseBody(request, UpdateStatusSchema);
    if ('error' in parsed) return parsed.error;

    const review =
      parsed.data.status === 'APPROVED'
        ? await reviewService.approve(id)
        : await reviewService.reject(id);
    return ok(review);
  } catch (error) {
    console.error('[PATCH /api/reviews/[id]]', error);
    return serverError();
  }
}
