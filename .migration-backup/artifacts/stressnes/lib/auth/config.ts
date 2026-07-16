import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth (Auth.js v5) configuration
 *
 * Providers are intentionally left empty for Task 1 (foundation only).
 * Add providers in a future task (e.g., Google, Credentials, etc.)
 *
 * @see https://authjs.dev
 */
export const authConfig: NextAuthConfig = {
  // Pages with custom routes
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/register',
  },

  // Callbacks for authorization logic
  callbacks: {
    /**
     * Protect routes: redirect unauthenticated users to login.
     * Runs on every request (edge-compatible, no DB calls here).
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith('/account') ||
        nextUrl.pathname.startsWith('/admin') ||
        nextUrl.pathname.startsWith('/checkout');

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL('/auth/login', nextUrl.origin);
        redirectUrl.searchParams.set('callbackUrl', nextUrl.href);
        return Response.redirect(redirectUrl);
      }

      return true;
    },

    /**
     * Extend the JWT with custom user fields (role, id, etc.)
     * Runs on sign in and token refresh.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Add role when model is implemented:
        // token.role = user.role;
      }
      return token;
    },

    /**
     * Expose custom token fields to the session object.
     */
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  // Session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Providers — add in future tasks
  providers: [],
};
