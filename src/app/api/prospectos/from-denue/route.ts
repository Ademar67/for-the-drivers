import { NextResponse } from 'next/server';
import { crearProspectoDesdeDenue } from '@/lib/firestore/clientes';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name, // nom_estab
      address, // domicilio construido
      phone, // telefono
      lat,
      lng,
      category, // 'taller' | 'refaccionaria'
      denueRaw, // el objeto completo de DENUE
    } = body ?? {};

    if (!denueRaw || !denueRaw.Id) {
      return NextResponse.json(
        { error: 'Faltan datos de DENUE o el ID del establecimiento.' },
        { status: 400 }
      );
    }
    
    if (!name) {
         return NextResponse.json(
        { error: 'Falta el nombre del establecimiento.' },
        { status: 400 }
      );
    }

    const result = await crearProspectoDesdeDenue({
      denueId: denueRaw.Id,
      nombre: name,
      telefono: phone || '',
      ciudad: denueRaw.Municipio || '',
      domicilio: address || '',
      lat,
      lng,
      claseActividad: denueRaw.Clase_actividad || '',
      tipoNegocio: category,
    });
    
    // El prospecto ya existía (deduplicado por denue.id)
    if (result.alreadyExists) {
      return NextResponse.json(
        { ok: true, created: false, id: result.id },
        { status: 200 }
      );
    }
    
    // Se creó un nuevo prospecto
    return NextResponse.json(
      { ok: true, created: true, id: result.id },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("from-denue error:", err);
    return NextResponse.json(
      { error: "Error creando prospecto desde DENUE", details: err.message },
      { status: 500 }
    );
  }
}
