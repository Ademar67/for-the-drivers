import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          error: "No se recibió code de Zoho",
        },
        {
          status: 400,
        }
      );
    }

    const accountsServer =
      request.nextUrl.searchParams.get("accounts-server") ||
      "https://accounts.zoho.com";

    const tokenUrl = `${decodeURIComponent(accountsServer)}/oauth/v2/token`;

    const clientId = process.env.ZOHO_CLIENT_ID ?? "";
    const clientSecret = process.env.ZOHO_CLIENT_SECRET ?? "";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "https://for-the-drivers.vercel.app/api/zoho/callback",
        code,
      }),
    });

    const raw = await response.text();

    return NextResponse.json({
      status: response.status,
      tokenUrl,

      codePreview: `${code.substring(0, 15)}...`,

      clientIdExists: !!clientId,
      clientSecretExists: !!clientSecret,

      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length,

      raw,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
      },
      {
        status: 500,
      }
    );
  }
}
