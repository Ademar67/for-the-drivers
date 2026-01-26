import { NextResponse } from "next/server";
import { getFichasTecnicas } from "@/lib/fichas-tecnicas";

export const runtime = "nodejs";

export async function GET() {
  const { items, error, detail } = await getFichasTecnicas();

  if (error) {
    return NextResponse.json(
      { error, detail },
      { status: 500 }
    );
  }

  return NextResponse.json({ items });
}
