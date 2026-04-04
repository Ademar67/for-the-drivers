import { recommendProducts } from '@/ai/flows/product-recommendation-engine';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type RequestBody = {
  customerNeeds?: unknown;
  query?: unknown;
  history?: unknown;
  maxProducts?: unknown;
  includeComplementaryProducts?: unknown;
  responseStyle?: unknown;
};

function isHistoryMessage(msg: unknown): msg is HistoryMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'role' in msg &&
    'content' in msg &&
    ((msg as { role?: unknown }).role === 'user' ||
      (msg as { role?: unknown }).role === 'assistant') &&
    typeof (msg as { content?: unknown }).content === 'string'
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const customerNeeds =
      typeof body?.customerNeeds === 'string'
        ? body.customerNeeds.trim()
        : typeof body?.query === 'string'
        ? body.query.trim()
        : '';

    const history: HistoryMessage[] = Array.isArray(body?.history)
      ? body.history
          .filter(isHistoryMessage)
          .map((msg: HistoryMessage) => ({
            role: msg.role,
            content: msg.content.trim(),
          }))
          .filter((msg: HistoryMessage) => msg.content.length > 0)
      : [];

    const maxProducts =
      typeof body?.maxProducts === 'number' &&
      Number.isFinite(body.maxProducts) &&
      body.maxProducts > 0
        ? Math.min(body.maxProducts, 10)
        : 5;

    const includeComplementaryProducts =
      typeof body?.includeComplementaryProducts === 'boolean'
        ? body.includeComplementaryProducts
        : true;

    const responseStyle =
      body?.responseStyle === 'simple' ? 'simple' : 'professional';

    if (!customerNeeds) {
      return NextResponse.json(
        { error: 'customerNeeds is required' },
        { status: 400 }
      );
    }

    const result = await recommendProducts({
      customerNeeds,
      history,
      maxProducts,
      includeComplementaryProducts,
      responseStyle,
    });

    return NextResponse.json({
      categoria: result?.categoria ?? 'general',
      sintoma: result?.sintoma ?? customerNeeds,
      diagnostico_orientativo:
        result?.diagnostico_orientativo ??
        'No se pudo generar un diagnóstico orientativo.',
      advertencia: result?.advertencia ?? '',
      severidad: result?.severidad ?? 'media',
      preguntas_clarificacion: Array.isArray(result?.preguntas_clarificacion)
        ? result.preguntas_clarificacion
        : [],
      productos_recomendados: Array.isArray(result?.productos_recomendados)
        ? result.productos_recomendados
        : [],
      speech_venta:
        result && typeof result === 'object' && 'speech_venta' in result
          ? (result.speech_venta ?? {})
          : {},
    });
  } catch (error) {
    console.error('[ASESOR DIGITAL API] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to get recommendation.',
        details: errorMessage,
        categoria: 'general',
        sintoma: '',
        diagnostico_orientativo:
          'Lo siento, no pude procesar la solicitud en este momento.',
        advertencia:
          'Verifica la información del vehículo e inténtalo de nuevo.',
        severidad: 'media',
        preguntas_clarificacion: [],
        productos_recomendados: [],
        speech_venta: {},
      },
      { status: 500 }
    );
  }
}