import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { rateLimiter } from './utils/rateLimit';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // Apply rate-limiting
  // if (!rateLimiter(clientIp)) {
  //   console.error(`Rate limit exceeded for IP: ${clientIp}`);
  //   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  // }

  const pathName = request.nextUrl.pathname;

  // Check for admin routes
  // console.log("token outer : ", token)
  // console.log("pathname : ", pathName)
  // if (pathName.startsWith('/admin')) {
  //   console.log("toklen : ", token)
  //   if (!token) {
  //     console.log('Unauthorized access attempt to admin route');
  //     return NextResponse.redirect(new URL('/auth/signin', request.url));
  //   }
  //   // Allow access for now, we'll check specific admin permissions in the API routes
  //   return NextResponse.next();
  // }

  /**
   * Define public, protected, and restricted routes.
   */
  const publicRoutes = [
    '/auth/signin',
    '/auth/register',
    '/auth/request-reset-password',
    '/auth/reset-password',
    '/auth/verifyemail',
  ];

  const restrictedIfAuthenticatedRoutes = [
    '/auth/signin',
    '/auth/register',
    '/auth/request-reset-password',
    '/auth/reset-password',
    '/auth/verifyemail',
  ];

  // If user is not authenticated:
  if (!token) {
    if (!publicRoutes.includes(pathName)) {
      console.log('Unauthenticated user trying to access protected route.');
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    return NextResponse.next(); // Allow public routes for unauthenticated users
  }

  // If user is authenticated:
  if (restrictedIfAuthenticatedRoutes.includes(pathName)) {
    console.log('Authenticated user trying to access a restricted route.');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access to all other routes for authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',                // Match all routes
    '/api/v1/:path*',    // Match all API routes
    // '/admin/:path*',     // Match all admin routes
    '/auth/:path*',      // Match all auth routes
    '/api/v1/admin/:path*', // Match all admin API routes
    '/superadmin/:path*', // Match all superadmin routes
    '/api/v1/superadmin/:path*', // Match all superadmin API routes
  ]
};
