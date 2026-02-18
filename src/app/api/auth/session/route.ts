import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Auth is disabled.
  return NextResponse.json({ status: 'auth-disabled' });
}
