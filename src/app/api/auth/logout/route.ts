import { NextResponse } from 'next/server';

export async function POST() {
  // Auth is disabled.
  return NextResponse.json({ status: 'auth-disabled' });
}
