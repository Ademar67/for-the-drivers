import { NextResponse } from 'next/server';

export async function POST() {
  // Tell the browser to expire the cookie immediately
  const options = {
    name: process.env.AUTH_COOKIE_NAME!,
    value: '',
    maxAge: -1,
  };

  const response = NextResponse.json({ status: 'success' });
  response.cookies.set(options);

  return response;
}
