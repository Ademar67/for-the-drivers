
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Excluir rutas que no deben ser protegidas
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes(".") // Excluir archivos estáticos como imagenes
  ) {
    return NextResponse.next();
  }

  // Redirigir todo lo demás a login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // El matcher asegura que el middleware se ejecute en las rutas necesarias
  // y evita que se ejecute en assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
