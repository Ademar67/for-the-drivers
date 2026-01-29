import { recommendProducts } from '@/ai/flows/product-recommendation-engine';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await recommendProducts({ customerNeeds: query });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[ASESOR DIGITAL API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to get recommendation.', details: errorMessage },
      { status: 500 }
    );
  }
}
