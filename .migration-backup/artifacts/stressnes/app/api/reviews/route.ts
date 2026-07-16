import { type NextRequest } from 'next/server';
import { reviewService } from '@/services/review.service';
import { CreateReviewSchema, ReviewListQuerySchema } from '@/lib/validations/review';
import { created, badRequest, serverError, paginated, conflict, parseBody } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = ReviewListQuerySchema.safeParse(params);
    if (!result.success) return badRequest('Invalid query parameters', result.error.format());

    const { data, total } = await reviewService.list(result.data);
    return paginated(data, total, result.data.page, result.data.pageSize);
  } catch (error) {
    console.error('[GET /api/reviews]', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const userId = (auth.session.user as { id: string }).id;
    const parsed = await parseBody(request, CreateReviewSchema);
    if ('error' in parsed) return parsed.error;

    try {
      const review = await reviewService.create(userId, parsed.data);
      return created(review);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('already reviewed')) {
        return conflict(err.message);
      }
      throw err;
    }
  } catch (error) {
    console.error('[POST /api/reviews]', error);
    return serverError();
  }
}
