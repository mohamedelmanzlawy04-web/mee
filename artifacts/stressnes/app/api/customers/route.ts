import { type NextRequest } from 'next/server';
import { userService } from '@/services/user.service';
import { z } from 'zod';
import { badRequest, serverError, paginated } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const result = QuerySchema.safeParse(params);
    if (!result.success) return badRequest('Invalid query parameters', result.error.format());

    const { data, total } = await userService.listCustomers(result.data);
    return paginated(data, total, result.data.page, result.data.pageSize);
  } catch (error) {
    console.error('[GET /api/customers]', error);
    return serverError();
  }
}
