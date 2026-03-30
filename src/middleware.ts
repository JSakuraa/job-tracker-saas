import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/resumes/:path*',
    '/quests/:path*',
    '/goals/:path*',
    '/rankings/:path*',
    '/rewards/:path*',
    '/profile/:path*',
    // Protect API routes except auth endpoints
    '/api/((?!auth).*)',
  ],
};
