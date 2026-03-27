import { auth } from '@/lib/auth';

export default auth;

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
    '/api/:path*',
  ],
};
