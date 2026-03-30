// Edge-compatible auth config for middleware
// This file must NOT import database clients or Node.js-only packages

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [], // Providers added in full config
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        '/dashboard',
        '/applications',
        '/resumes',
        '/quests',
        '/goals',
        '/rankings',
        '/rewards',
        '/profile',
      ];

      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
