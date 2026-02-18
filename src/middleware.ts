import { NextResponse, type NextRequest } from 'next/server';

// Auth middleware disabled.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Other public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-liqui-moly.png|icon-512x512.png|manifest.json).*)',
  ],
};
