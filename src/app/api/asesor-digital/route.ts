export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { recommendProducts } from '@/ai/flows/product-recommendation-engine';

type ProductCard = {
  name: string;
  sku?: string;
  why?: string;
  howToUse?: string;
  category?: string;
  techSheetUrl?: string;
  productUrl?: string;
};

type AsesorResponse = {
  answer: string;
  products?: ProductCard[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result: any = await recommendProducts({
      customerNeeds: JSON.stringify(body),
    });

    // Soporta varios formatos (por si Genkit/Gemini cambia)
    const data: AsesorResponse =
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
