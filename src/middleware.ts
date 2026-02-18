import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get(process.env.AUTH_COOKIE_NAME!)?.value;
  const { pathname } = req.nextUrl;

  const authPages = ['/login', '/sign-up', '/forgot-password'];
  const isAuthPage = authPages.some(page => pathname.startsWith(page));

  // If the user is logged in, and tries to access an auth page, redirect to dashboard.
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If the user is not logged in, and tries to access a protected page, redirect to login.
  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If the user is at the root, decide where to send them.
  if (pathname === '/') {
      if (sessionCookie) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
          return NextResponse.redirect(new URL('/login', req.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (for login/logout)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Other public assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|logo-liqui-moly.png|icon-512x512.png|manifest.json).*)',
  ],
};
