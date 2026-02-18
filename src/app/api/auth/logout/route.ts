import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getCookieName() {
  return process.env.AUTH_COOKIE_NAME || "lm_session";
}

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set(getCookieName(), "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}