import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

function getCookieName() {
  return process.env.AUTH_COOKIE_NAME || 'lm_session';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Let authentication API routes pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = req.cookies.get(getCookieName())?.value;

  // If no session cookie and not on login page, redirect to login
  if (!sessionCookie && !pathname.startsWith('/login')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If there is a session cookie, verify it
  if (sessionCookie) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      
      // If user is authenticated and tries to access /login, redirect to dashboard
      if (pathname.startsWith('/login')) {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        url.search = '';
        return NextResponse.redirect(url);
      }
      
      // Allow authenticated user to proceed
      return NextResponse.next();

    } catch (error) {
      // Cookie is invalid. Clear it and redirect to login.
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete(getCookieName());
      return response;
    }
  }

  // If on login page without a cookie, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This will include all pages and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo-liqui-moly.png|icon-512x512.png|manifest.json).*)'
  ]
};
