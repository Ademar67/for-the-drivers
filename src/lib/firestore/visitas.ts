'use server';
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

export type Visita = {
  id: string;
  cliente: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  estado: 'pendiente' | 'realizada';
  notas: string;
  createdAt: Timestamp;
};

export async function crearVisita(visita: Omit<Visita, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'visitas'), {
    ...visita,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function obtenerVisitas(): Promise<Visita[]> {
  const q = query(collection(db, 'visitas'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  const visitas = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      cliente: data.cliente,
      fecha: data.fecha,
      hora: data.hora,
      tipo: data.tipo,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.createdAt,
    } as Visita;
  });

  return visitas;
}
