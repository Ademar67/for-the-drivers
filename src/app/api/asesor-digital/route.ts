export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { recommendProducts } from '@/ai/flows/product-recommendation-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result: any = await recommendProducts({
      customerNeeds: JSON.stringify(body),
    });

    // Soporta varios formatos (por si Genkit/Gemini cambia)
    // By typing `data` as `any`, we prevent build errors if the AI response
    // doesn't perfectly match a strict type. The logic below already
    // safely handles different possible structures.
    const data: any =
      result?.output ??
      result ??
      {
        answer: typeof result === 'string' ? result : '',
        products: [],
      };

    // Fallback si vino solo texto
    const answer =
      data?.answer ||
      data?.['text'] ||
      (typeof result === 'string' ? result : '') ||
      'No se pudo generar una respuesta.';

    const products = Array.isArray(data?.products) ? data.products : [];

    return NextResponse.json({ answer, products });
  } catch (error: any) {
    console.error('[ASESOR_DIGITAL_ERROR]', error);
    return NextResponse.json(
      { answer: 'Error interno.', products: [] },
      { status: 500 }
    );
  }
}
