export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { askSupportAssistant, AiSupportAssistantInput } from '@/ai/flows/ai-support-assistant';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // El frontend envía un objeto como: { query: "texto del usuario" }
    // Lo pasamos directamente al flujo de IA.
    const input: AiSupportAssistantInput = body;

    if (!input.query) {
      return new NextResponse('La consulta (query) es requerida', { status: 400 });
    }

    const result = await askSupportAssistant(input);

    // El flujo devuelve un objeto como: { answer: "Respuesta de la IA" }
    // Lo devolvemos directamente al frontend.
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('[ASESOR_DIGITAL_ERROR]', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
