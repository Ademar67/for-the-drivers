
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const [user, loading] = useAuthState(auth);

  if (loading) {
    return NextResponse.next();
  }

  const publicRoutes = ['/login', '/sign-up', '/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-liqui-moly.png|icon-512x512.png|manifest.json).*)'
  ]
};
