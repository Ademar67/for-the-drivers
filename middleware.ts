
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieName = process.env.AUTH_COOKIE_NAME || 'lm_session';

  // Permitir el acceso a la página de login y a las APIs de autenticación
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const session = req.cookies.get(cookieName)?.value;

  // Si no hay sesión, redirigir a la página de login
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar la cookie de sesión
  try {
    await adminAuth.verifySessionCookie(session, true);
    
    // Si el usuario está autenticado y en la raíz, redirigir al dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // La sesión es válida, continuar
    return NextResponse.next();
  } catch (error) {
    // La sesión es inválida, redirigir al login y limpiar la cookie incorrecta
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(cookieName, '', { maxAge: 0 });
    
    return response;
  }
}

export const config = {
  // Ejecutar el middleware en todas las rutas excepto en los assets estáticos y rutas internas de Next.js
  matcher: ['/((?!_next|.*\\..*).*)'],
};
