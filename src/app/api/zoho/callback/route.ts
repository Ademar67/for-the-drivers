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

    const accountsServer =
      request.nextUrl.searchParams.get("accounts-server") ||
      "https://accounts.zoho.com";

    const tokenUrl = `${decodeURIComponent(accountsServer)}/oauth/v2/token`;

    console.log("ZOHO TOKEN URL:", tokenUrl);

    const response = await fetch(tokenUrl, {
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

    const text = await response.text();

    return NextResponse.json({
      status: response.status,
      tokenUrl,
      raw: text,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? "Error desconocido",
      },
      { status: 500 }
    );
  }
}
