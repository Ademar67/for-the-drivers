
'use server';

import { NextResponse } from 'next/server';
import { recommendProducts, ProductRecommendationInput } from '@/ai/flows/product-recommendation-engine';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const input: ProductRecommendationInput = {
      customerNeeds: JSON.stringify(body),
    };

    const result = await recommendProducts(input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ASESOR_DIGITAL_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
