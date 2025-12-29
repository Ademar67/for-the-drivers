
'use client';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

export type Visita = {
  id: string;
  cliente: string;
  clienteId: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  estado: 'pendiente' | 'realizada';
  notas: string;
  createdAt: string;
  lat?: number;
  lng?: number;
};

type CrearVisitaInput = {
  cliente: string;
  clienteId: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  estado: 'pendiente' | 'realizada';
  notas: string;
  lat?: number;
  lng?: number;
};

export async function crearVisita(visita: CrearVisitaInput) {
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
    const createdAt = data.createdAt as Timestamp;
    return {
      id: doc.id,
      cliente: data.cliente,
      clienteId: data.clienteId,
      fecha: data.fecha,
      hora: data.hora,
      tipo: data.tipo,
      estado: data.estado,
      notas: data.notas,
      createdAt: createdAt.toDate().toISOString(),
      lat: data.lat,
      lng: data.lng,
    } as Visita;
  });

  return visitas;
}

export async function marcarVisitaRealizada(visitaId: string) {
  const visitaRef = doc(db, 'visitas', visitaId);
  await updateDoc(visitaRef, {
    estado: 'realizada',
  });
}
