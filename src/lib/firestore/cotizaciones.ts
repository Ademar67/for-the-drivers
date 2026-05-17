import { db, auth } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type CotizacionItem = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  codigo?: string;
  descuentos?: [number, number, number, number];
  subtotalLinea?: number;
  descuentoLinea?: number;
  totalLinea?: number;
};

export type CotizacionFS = {
  id?: string;
  ownerId?: string;
  ownerEmail?: string;
  clienteId: string;
  clienteNombre: string;
  items: CotizacionItem[];
  subtotal: number;
  total: number;
  totalDescuentos?: number;
  observaciones?: string;
  vigenciaDias?: number;
  createdAt?: any;
  updatedAt?: any;
};

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Debes iniciar sesión.');
  }

  return user;
}

export async function crearCotizacion(input: {
  clienteId: string;
  clienteNombre: string;
  items: CotizacionItem[];
  subtotal: number;
  total: number;
  totalDescuentos?: number;
  observaciones?: string;
  vigenciaDias?: number;
}) {
  const user = getCurrentUserOrThrow();

  const ref = await addDoc(collection(db, 'cotizaciones'), {
    ownerId: user.uid,
    ownerEmail: user.email ?? '',
    clienteId: input.clienteId,
    clienteNombre: input.clienteNombre,
    items: input.items,
    subtotal: input.subtotal,
    total: input.total,
    totalDescuentos: input.totalDescuentos ?? 0,
    observaciones: input.observaciones ?? '',
    vigenciaDias: input.vigenciaDias ?? 7,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    const { agregarTimelineEvento } = await import('@/lib/firestore/clientes');
    await agregarTimelineEvento(input.clienteId, {
      tipo: 'cotizacion',
      texto: `Se generó una cotización por $${input.total.toFixed(2)}.`,
    });
  } catch (e) {
    console.warn('Timeline cotización no registrado:', e);
  }

  return ref.id;
}


export function listenCotizaciones(callback: (cotizaciones: CotizacionFS[]) => void) {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, 'cotizaciones'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<CotizacionFS, 'id'>),
    })) as CotizacionFS[];

    data.sort((a, b) => {
      const aTime =
        typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
      const bTime =
        typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;

      return bTime - aTime;
    });

    callback(data);
  });
}

export async function obtenerCotizaciones() {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, 'cotizaciones'),
    where('ownerId', '==', user.uid)
  );

  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<CotizacionFS, 'id'>),
  })) as CotizacionFS[];

  data.sort((a, b) => {
    const aTime =
      typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
    const bTime =
      typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;

    return bTime - aTime;
  });

  return data;
}

export async function obtenerCotizacionPorId(id: string) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Falta el id de la cotización.');
  }

  const ref = doc(db, 'cotizaciones', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error('La cotización no existe.');
  }

  return {
    id: snap.id,
    ...(snap.data() as Omit<CotizacionFS, 'id'>),
  } as CotizacionFS;
}

export async function actualizarCotizacion(
  id: string,
  data: Partial<Omit<CotizacionFS, 'id' | 'ownerId' | 'ownerEmail' | 'createdAt'>>
) {
  getCurrentUserOrThrow();

  if (!id) {
    throw new Error('Falta el id de la cotización.');
  }

  await updateDoc(doc(db, 'cotizaciones', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}