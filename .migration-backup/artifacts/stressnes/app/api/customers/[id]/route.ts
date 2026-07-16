import { type NextRequest } from 'next/server';
import { userService } from '@/services/user.service';
import { ok, notFound, serverError } from '@/lib/api/response';
import { requireAdmin } from '@/lib/api/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = await params;
    const user = await userService.getProfile(id);
    if (!user) return notFound('Customer not found');
    return ok(user);
  } catch (error) {
    console.error('[GET /api/customers/[id]]', error);
    return serverError();
  }
}
