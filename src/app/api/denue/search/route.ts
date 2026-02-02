import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// IMPORTANT: This is a placeholder token. Replace with a real INEGI API token in your .env.local file.
const INEGI_API_TOKEN = process.env.INEGI_API_KEY || 'REPLACE_WITH_YOUR_INEGI_API_TOKEN';

/**
 * Searches the DENUE directory for businesses near a given location.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '250'; // Default radius 250m
  const tipo = searchParams.get('tipo'); // e.g., 'taller', 'refaccionaria'

  if (!lat || !lng || !tipo) {
    return NextResponse.json(
      { error: 'Missing required parameters: lat, lng, tipo' },
      { status: 400 }
    );
  }

  // Map internal type to DENUE search terms
  const searchTerms: { [key: string]: string } = {
    taller: 'mecánico',
    refaccionaria: 'refacciones y accesorios para automóviles',
  };

  const condition = searchTerms[tipo];
  if (!condition) {
    return NextResponse.json({ error: 'Invalid tipo parameter' }, { status: 400 });
  }

  const url = `https://www.inegi.org.mx/servicios/api/denue/v1/consulta/buscar/${condition}/${lat},${lng}/${radius}/${INEGI_API_TOKEN}`;

  try {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('DENUE API Error:', errorText);
        throw new Error(`DENUE API failed with status ${response.status}`);
    }

    // INEGI API sometimes returns JSON with a BOM character at the start, which needs to be removed.
    const rawText = await response.text();
    const cleanText = rawText.trim().replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[DENUE SEARCH API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch data from DENUE API.', details: errorMessage },
      { status: 500 }
    );
  }
}
