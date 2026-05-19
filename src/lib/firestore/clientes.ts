import { db, auth } from '@/lib/firebase';

import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  where,
  orderBy,
} from 'firebase/firestore';

export type EstadoProspecto =
  | 'nuevo'
  | 'visitado'
  | 'seguimiento'
  | 'interesado'
  | 'no_interesado';

export type ClienteFS = {
  id?: string;
  ownerId?: string;
  ownerEmail?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  tipoZona?: 'local' | 'foraneo';
  ciudad: string;
  domicilio: string;
  diaVisita: string | null;
  frecuencia: string | null;
  semanaVisita?: number | null;
  createdAt: Timestamp;
  nota?: string;
  lat?: number;
  lng?: number;
  origen?: string;

  // 🔥 NUEVO: ID plano para evitar problemas con queries anidados
  denueId?: string;

  estadoProspecto?: EstadoProspecto;
  ultimaVisita?: Timestamp | null;
  proximaVisita?: Timestamp | null;

  denue?: {
    id: string;
    actividad?: string;
    tipoNegocio?: 'taller' | 'refaccionaria';
    fechaImportado: Timestamp;
  };

  updatedAt?: Timestamp;
};

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Debes iniciar sesión.');
  }

  return user;
}

export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, 'clientes'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as ClienteFS[];

    clientes.sort((a, b) => {
      const aTime =
        typeof a.createdAt?.toMillis === 'function'
          ? a.createdAt.toMillis()
          : 0;

      const bTime =
        typeof b.createdAt?.toMillis === 'function'
          ? b.createdAt.toMillis()
          : 0;

      return bTime - aTime;
    });

    callback(clientes);
  });
}

export async function crearCliente(input: {
  nombre: string;
  ciudad: string;
  domicilio: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  tipoZona: 'local' | 'foraneo';
  diaVisita: string | null;
  frecuencia: string | null;
  semanaVisita: number | null;
  nota: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const user = getCurrentUserOrThrow();

  await addDoc(collection(db, 'clientes'), {
    ownerId: user.uid,
    ownerEmail: user.email ?? '',

    nombre: input.nombre.trim(),
    ciudad: input.ciudad.trim(),
    domicilio: input.domicilio.trim(),

    tipo: input.tipo,
    tipoZona: input.tipoZona,

    diaVisita: input.diaVisita,
    frecuencia: input.frecuencia,
    semanaVisita: input.semanaVisita,

    nota: input.nota,
    lat: input.lat ?? null,
    lng: input.lng ?? null,

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function crearProspectoDesdeDenue(input: {
  ownerId: string;
  ownerEmail?: string;
  denueId: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  domicilio: string;
  lat: number | null;
  lng: number | null;
  claseActividad: string;
  tipoNegocio: 'taller' | 'refaccionaria';
}) {
  if (!input?.ownerId?.trim()) {
    throw new Error('Falta ownerId para crear el prospecto.');
  }

  if (!input?.denueId?.trim()) {
    throw new Error('Datos de negocio de DENUE inválidos o sin ID.');
  }

  const ownerId = input.ownerId.trim();
  const denueId = input.denueId.trim();

  try {
    // 🔍 Validar duplicado por usuario + DENUE
    const existingQ = query(
      collection(db, 'clientes'),
      where('ownerId', '==', ownerId),
      where('denueId', '==', denueId)
    );

    const existingSnap = await getDocs(existingQ);

    if (!existingSnap.empty) {
      return {
        ok: true,
        alreadyExists: true,
        id: existingSnap.docs[0].id,
      };
    }

    const prospectoData: Record<string, any> = {
      ownerId,
      ownerEmail: input.ownerEmail ?? '',

      nombre: input.nombre?.trim() || 'Prospecto DENUE',
      tipo: 'prospecto',

      estadoProspecto: 'nuevo',
      ultimaVisita: null,
      proximaVisita: null,

      ciudad: input.ciudad?.trim() || 'N/A',
      domicilio: input.domicilio?.trim() || 'N/A',

      diaVisita: null,
      frecuencia: null,
      semanaVisita: null,

      nota: `Importado desde DENUE.${
        input.claseActividad?.trim()
          ? ` Actividad: ${input.claseActividad.trim()}.`
          : ''
      }`,

      origen: 'DENUE',

      // ✅ Campo plano para queries rápidas
      denueId,

      // ✅ Objeto completo DENUE
      denue: {
        id: denueId,
        tipoNegocio: input.tipoNegocio,
        fechaImportado: Timestamp.now(),

        ...(input.claseActividad?.trim()
          ? { actividad: input.claseActividad.trim() }
          : {}),
      },

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (input.telefono?.trim()) {
      prospectoData.telefono = input.telefono.trim();
    }

    if (typeof input.lat === 'number' && Number.isFinite(input.lat)) {
      prospectoData.lat = input.lat;
    }

    if (typeof input.lng === 'number' && Number.isFinite(input.lng)) {
      prospectoData.lng = input.lng;
    }

    const ref = await addDoc(collection(db, 'clientes'), prospectoData);

    return {
      ok: true,
      alreadyExists: false,
      id: ref.id,
    };
  } catch (error) {
    console.error('🔥 ERROR REAL DENUE:', error);

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error creando prospecto desde DENUE'
    );
  }
}

export async function eliminarCliente(id: string) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Se requiere un ID de cliente para eliminarlo.');
  }

  await deleteDoc(doc(db, 'clientes', id));
}

export async function cambiarTipoCliente(
  id: string,
  tipo: 'prospecto' | 'cliente' | 'inactivo'
) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Falta id del cliente');
  }

  await updateDoc(doc(db, 'clientes', id), {
    tipo,
    updatedAt: serverTimestamp(),
  });
}

export async function marcarVisitaProspecto(
  id: string,
  opciones?: {
    estado?: Exclude<EstadoProspecto, 'nuevo'>;
    nota?: string;
  }
) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Falta id del prospecto');
  }

  const ref = doc(db, 'clientes', id);

  const data: Record<string, any> = {
    ultimaVisita: serverTimestamp(),
    estadoProspecto: opciones?.estado ?? 'visitado',
    updatedAt: serverTimestamp(),
  };

  if (opciones?.nota?.trim()) {
    data.nota = opciones.nota.trim();
  }

  await updateDoc(ref, data);

await agregarTimelineEvento(id, {
  tipo: 'visita',
  texto: 'Se registró una visita comercial.',
});
}


export async function programarSeguimientoProspecto(
  id: string,
  proximaVisita: Date,
  opciones?: {
    estado?: Extract<EstadoProspecto, 'seguimiento' | 'interesado'>;
    nota?: string;
  }
) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Falta id del prospecto');
  }

  if (!(proximaVisita instanceof Date) || Number.isNaN(proximaVisita.getTime())) {
    throw new Error('La fecha de próxima visita no es válida');
  }

  const ref = doc(db, 'clientes', id);

  const data: Record<string, any> = {
    proximaVisita: Timestamp.fromDate(proximaVisita),
    estadoProspecto: opciones?.estado ?? 'seguimiento',
    updatedAt: serverTimestamp(),
  };

  if (opciones?.nota?.trim()) {
    data.nota = opciones.nota.trim();
  }

  await updateDoc(ref, data);

await agregarTimelineEvento(id, {
  tipo: 'seguimiento',
  texto: 'Se programó seguimiento comercial.',
});
}

export type TimelineEvento = {
  id?: string;
  tipo:
    | 'nota'
    | 'visita'
    | 'seguimiento'
    | 'cotizacion'
    | 'whatsapp'
    | 'conversion';
  texto: string;
  createdAt?: Timestamp;
  ownerId: string;
};

export async function agregarTimelineEvento(
  clienteId: string,
  evento: {
    tipo: TimelineEvento['tipo'];
    texto: string;
  }
) {
  const user = getCurrentUserOrThrow();

  if (!clienteId) {
    throw new Error('Falta clienteId');
  }

  await addDoc(collection(db, 'clientes', clienteId, 'timeline'), {
    tipo: evento.tipo,
    texto: evento.texto,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });
}

export function listenTimelineCliente(
  clienteId: string,
  callback: (items: TimelineEvento[]) => void
) {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, 'clientes', clienteId, 'timeline'),
    where('ownerId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TimelineEvento, 'id'>),
    }));

    callback(data);
  });
}
export async function obtenerProspectosEnRiesgo(diasSinContacto = 7): Promise<ClienteFS[]> {
  const user = getCurrentUserOrThrow();

  const snap = await getDocs(
    query(
      collection(db, 'clientes'),
      where('ownerId', '==', user.uid),
      where('tipo', '==', 'prospecto')
    )
  );

  const ahora = Date.now();
  const limite = diasSinContacto * 24 * 60 * 60 * 1000;

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ClienteFS))
    .filter((p) => {
      if (p.estadoProspecto === 'no_interesado') return false;

      const ultimoContacto =
        p.ultimaVisita instanceof Timestamp
          ? p.ultimaVisita.toMillis()
          : p.proximaVisita instanceof Timestamp
          ? p.proximaVisita.toMillis()
          : p.createdAt instanceof Timestamp
          ? p.createdAt.toMillis()
          : 0;

      return ahora - ultimoContacto > limite;
    })
    .sort((a, b) => {
      const aMs = a.ultimaVisita instanceof Timestamp ? a.ultimaVisita.toMillis() : 0;
      const bMs = b.ultimaVisita instanceof Timestamp ? b.ultimaVisita.toMillis() : 0;
      return aMs - bMs;
    });
}
