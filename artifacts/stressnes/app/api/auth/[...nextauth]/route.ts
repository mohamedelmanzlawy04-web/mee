import { handlers } from '@/lib/auth';

/**
 * NextAuth route handler
 * Handles GET and POST requests for all auth operations:
 * /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
 */
export const { GET, POST } = handlers;
