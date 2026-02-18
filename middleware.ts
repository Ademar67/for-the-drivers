import { NextResponse, type NextRequest } from "next/server";

function getCookieName() {
  return process.env.AUTH_COOKIE_NAME || "lm_session";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // permitir login y APIs auth
  if (pathname.startsWith("/login")) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // permitir assets Next
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/favicon")) return NextResponse.next();

  const session = req.cookies.get(getCookieName())?.value;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};