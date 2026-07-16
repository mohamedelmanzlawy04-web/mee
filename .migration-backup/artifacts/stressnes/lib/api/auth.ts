import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { unauthorized, forbidden } from '@/lib/api/response';

/** Require an authenticated session. Returns session or a 401 response. */
export async function requireAuth(): Promise<
  { session: Session } | { error: ReturnType<typeof unauthorized> }
> {
  const session = await auth();
  if (!session?.user) return { error: unauthorized() };
  return { session };
}

/** Require an authenticated ADMIN user. Returns session or 401/403. */
export async function requireAdmin(): Promise<
  { session: Session } | { error: ReturnType<typeof unauthorized> | ReturnType<typeof forbidden> }
> {
  const session = await auth();
  if (!session?.user) return { error: unauthorized() };
  if ((session.user as { role?: string }).role !== 'ADMIN') return { error: forbidden() };
  return { session };
}
