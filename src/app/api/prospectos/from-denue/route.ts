import { NextResponse } from 'next/server';
import { crearProspectoDesdeDenue } from '@/lib/firestore/clientes';

function getDenueId(denueRaw: any): string | null {
  const id =
    denueRaw?.Id ??
    denueRaw?.id ??
    denueRaw?.clee ??
    denueRaw?.id_denue ??
    null;

  if (!id) return null;

  return String(id);
}

function getDenueMunicipio(denueRaw: any): string {
  return String(
    denueRaw?.Municipio ??
      denueRaw?.municipio ??
      denueRaw?.nom_mun ??
      ''
  ).trim();
}

function getDenueClaseActividad(denueRaw: any): string {
  return String(
    denueRaw?.Clase_actividad ??
      denueRaw?.clase_actividad ??
      denueRaw?.descripcion_actividad ??
      ''
  ).trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      address,
      phone,
      lat,
      lng,
      category,
      denueRaw,
    } = body ?? {};

    const denueId = getDenueId(denueRaw);

    if (!denueRaw || !denueId) {
      return NextResponse.json(
        { error: 'Faltan datos de DENUE o el ID del establecimiento.' },
        { status: 400 }
      );
    }

    const nombre = String(name ?? '').trim();
    if (!nombre) {
      return NextResponse.json(
        { error: 'Falta el nombre del establecimiento.' },
        { status: 400 }
      );
    }

    const domicilio = String(address ?? '').trim();
    const telefono = String(phone ?? '').trim();
    const tipoNegocio =
      category === 'taller' || category === 'refaccionaria'
        ? category
        : 'taller';

    const latNumber =
      typeof lat === 'number' && Number.isFinite(lat) ? lat : null;
    const lngNumber =
      typeof lng === 'number' && Number.isFinite(lng) ? lng : null;

    console.log('DENUE DATA NORMALIZED:', {
      denueId,
      nombre,
      domicilio,
      telefono,
      ciudad: getDenueMunicipio(denueRaw),
      lat: latNumber,
      lng: lngNumber,
      tipoNegocio,
    });

    const result = await crearProspectoDesdeDenue({
      denueId,
      nombre,
      telefono,
      ciudad: getDenueMunicipio(denueRaw),
      domicilio,
      lat: latNumber,
      lng: lngNumber,
      claseActividad: getDenueClaseActividad(denueRaw),
      tipoNegocio,
    });

    if (result.alreadyExists) {
      return NextResponse.json(
        { ok: true, created: false, id: result.id },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: true, created: true, id: result.id },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('from-denue error:', err);

    return NextResponse.json(
      {
        error: 'Error creando prospecto desde DENUE',
        details: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}