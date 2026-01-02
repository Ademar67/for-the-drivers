
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import type { Cotizacion, CotizacionItem } from '@/lib/firebase-types';

type CrearCotizacionInput = {
  clienteId: string;
  clienteNombre: string;
  items: {
    productoId: string;
    nombre: string;
    codigo: string;
    cantidad: number;
    precio: number;
  }[];
  subtotal: number;
  descuentos: (number | undefined)[];
  total: number;
};

export async function crearCotizacion(input: CrearCotizacionInput) {
  const cotizacionData = {
    ...input,
    fecha: serverTimestamp(),
    estado: 'pendiente' as const,
  };
  const docRef = await addDoc(collection(db, 'cotizaciones'), cotizacionData);
  return docRef.id;
}

export async function obtenerCotizaciones(): Promise<Cotizacion[]> {
  const q = query(collection(db, 'cotizaciones'), orderBy('fecha', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      clienteId: data.clienteId,
      clienteNombre: data.clienteNombre,
      fecha: data.fecha as Timestamp,
      subtotal: data.subtotal,
      descuentos: data.descuentos,
      total: data.total,
      estado: data.estado,
      items: data.items,
    } as Cotizacion;
  });
}
