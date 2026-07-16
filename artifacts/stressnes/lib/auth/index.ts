import NextAuth from 'next-auth';

import { authConfig } from './config';

/**
 * Export Auth.js handlers, auth(), signIn(), signOut() helpers.
 *
 * Usage in app/api/auth/[...nextauth]/route.ts:
 *   import { handlers } from '@/lib/auth';
 *   export const { GET, POST } = handlers;
 *
 * Usage in Server Components:
 *   import { auth } from '@/lib/auth';
 *   const session = await auth();
 *
 * Usage in Server Actions:
 *   import { signIn, signOut } from '@/lib/auth';
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
