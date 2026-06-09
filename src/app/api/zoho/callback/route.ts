import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "No se recibió code de Zoho" },
        { status: 400 }
      );
    }

    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ZOHO_CLIENT_ID ?? "",
        client_secret: process.env.ZOHO_CLIENT_SECRET ?? "",
        redirect_uri: "https://for-the-drivers.vercel.app/api/zoho/callback",
        code,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? "Error desconocido",
      },
      { status: 500 }
    );
  }
}
