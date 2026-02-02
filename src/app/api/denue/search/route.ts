import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DENUE_TOKEN = process.env.DENUE_TOKEN;

const TERMS: Record<string, string[]> = {
  // suele responder bien
  taller: ['taller mecanico', 'mecanico'],

  // aquí es donde DENUE a veces se pone mamón con el texto exacto,
  // por eso probamos varios
  refaccionaria: [
    'refaccionaria',
    'refacciones',
    'refacciones y accesorios para automoviles',
    'refacciones y accesorios para vehículos automotores',
  ],
};

async function fetchDenue(condition: string, lat: string, lng: string, radius: string, token: string) {
  const encodedCondition = encodeURIComponent(condition);

  const url =
    `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/` +
    `${encodedCondition}/${lat},${lng}/${radius}/${token}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const rawText = await response.text();
  const cleanText = rawText.trim().replace(/^\uFEFF/, '');

  return { response, cleanText };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '1000';
    const tipo = searchParams.get('tipo'); // 'taller' | 'refaccionaria'

    if (!DENUE_TOKEN) {
      return NextResponse.json(
        { error: 'Falta configurar DENUE_TOKEN en variables de entorno.' },
        { status: 500 }
      );
    }

    if (!lat || !lng || !tipo) {
      return NextResponse.json(
        { error: 'Faltan parámetros: lat, lng, tipo' },
        { status: 400 }
      );
    }

    const attempts = TERMS[tipo];
    if (!attempts) {
      return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
    }

    // Probamos varios términos hasta que uno funcione
    let lastError: any = null;

    for (const term of attempts) {
      const { response, cleanText } = await fetchDenue(term, lat, lng, radius, DENUE_TOKEN);

      if (response.ok) {
        const data = JSON.parse(cleanText);
        return NextResponse.json(data);
      }

      // guardamos el último error para devolver algo útil
      lastError = { status: response.status, details: cleanText, term };
      // seguimos intentando con otro término
    }

    console.error('DENUE API Error (all terms failed):', lastError);
    return NextResponse.json(
      {
        error: `DENUE API failed for tipo=${tipo}`,
        details: lastError,
      },
      { status: lastError?.status || 500 }
    );
  } catch (error) {
    console.error('[DENUE SEARCH API] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch data from DENUE API.', details: msg },
      { status: 500 }
    );
  }
}