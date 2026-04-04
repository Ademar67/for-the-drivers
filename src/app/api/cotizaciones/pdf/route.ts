import { NextResponse } from 'next/server';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';
import type { CotizacionPDFData } from '@/lib/pdf/types';

export async function POST(req: Request) {
  try {
    const cotizacion = (await req.json()) as CotizacionPDFData;

    const doc = await generarCotizacionPDF(cotizacion);
    const arrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="cotizacion.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);

    return NextResponse.json(
      { error: 'No se pudo generar el PDF' },
      { status: 500 }
    );
  }
}