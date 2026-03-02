import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generarCotizacionPDF } from '@/lib/pdf/generarCotizacionPDF';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const vigencia = searchParams.get('vigencia') ?? undefined; // ✅ NUEVO

    if (!id) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    }

    const ref = doc(db, 'cotizaciones', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // ✅ Le pegamos vigencia manual a la cotización (solo para el PDF)
    const cotizacion = { id: snap.id, ...snap.data(), vigencia } as any;

    const blob = await generarCotizacionPDF(cotizacion);
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="cotizacion-${id}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}