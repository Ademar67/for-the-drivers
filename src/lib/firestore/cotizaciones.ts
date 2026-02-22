
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { Cotizacion as CotizacionBase, CotizacionItem } from '@/lib/firebase-types';

// Extend the base type to ensure 'fecha' is a Timestamp, as it will be after fetching
export interface Cotizacion extends Omit<CotizacionBase, 'fecha'> {
  id: string; // Asegurarse de que el id siempre esté presente
  fecha: Timestamp;
  fecha_creacion?: {
    seconds: number;
    nanoseconds: number;
  };
}

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
    fecha_creacion: serverTimestamp(),
    estado: 'pendiente' as const,
  };
  const docRef = await addDoc(collection(db, 'cotizaciones'), cotizacionData);
  return docRef.id;
}

export async function obtenerCotizaciones(): Promise<Cotizacion[]> {
  const q = query(collection(db, 'cotizaciones'), orderBy('fecha_creacion', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      clienteId: data.clienteId,
      clienteNombre: data.clienteNombre,
      fecha: data.fecha_creacion as Timestamp, // Mantener compatibilidad
      fecha_creacion: data.fecha_creacion, // Agregar el campo para el UI
      subtotal: data.subtotal,
      descuentos: data.descuentos || [],
      total: data.total,
      estado: data.estado,
      items: data.items || [],
    } as Cotizacion;
  });
}

export async function obtenerCotizacionPorId(id: string): Promise<Cotizacion | null> {
  const docRef = doc(db, 'cotizaciones', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    clienteId: data.clienteId,
    clienteNombre: data.clienteNombre,
    fecha: data.fecha_creacion as Timestamp,
    fecha_creacion: data.fecha_creacion,
    subtotal: data.subtotal,
    descuentos: data.descuentos || [],
    total: data.total,
    estado: data.estado,
    items: data.items || [],
  } as Cotizacion;
}


export async function eliminarCotizacion(id: string): Promise<void> {
  const cotizacionRef = doc(db, 'cotizaciones', id);
  await deleteDoc(cotizacionRef);
}
