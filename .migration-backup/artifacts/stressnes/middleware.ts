import { auth } from '@/lib/auth';

/**
 * Next.js Middleware
 *
 * Runs on every matched request BEFORE it reaches the page or API route.
 * Uses Auth.js v5 `auth()` as middleware to protect routes.
 *
 * Authorization logic lives in authConfig.callbacks.authorized.
 * This file only wires Next.js middleware to Auth.js.
 *
 * @see lib/auth/config.ts for route protection rules
 */
export default auth;

/**
 * Middleware config — define which paths this middleware runs on.
 * Using a negative lookahead to exclude static files and Next.js internals.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, manifests, robots, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
