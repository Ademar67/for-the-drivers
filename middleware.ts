import { NextResponse, type NextRequest } from 'next/server';

// Auth middleware disabled.
export function middleware(req: NextRequest) {
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
