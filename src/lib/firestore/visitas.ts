
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
  onSnapshot,
  deleteDoc,
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
  fechaRealizada?: Timestamp;
};

type CrearVisitaInput = {
  cliente: string;
  clienteId: string;
  fecha: string;
  hora: string;
  tipo: 'visita' | 'cotizacion' | 'cobranza' | 'seguimiento';
  estado: 'pendiente' | 'realizada';
  notas: string;
};

export async function crearVisita(visita: CrearVisitaInput) {
  const docRef = await addDoc(collection(db, 'visitas'), {
    ...visita,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function listenVisitas(callback: (visitas: Visita[]) => void) {
  const q = query(collection(db, 'visitas'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const visitas = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt as Timestamp;
      const fechaRealizada = data.fechaRealizada as Timestamp;
      return {
        id: doc.id,
        cliente: data.cliente,
        clienteId: data.clienteId,
        fecha: data.fecha,
        hora: data.hora,
        tipo: data.tipo,
        estado: data.estado,
        notas: data.notas,
        createdAt: createdAt ? createdAt.toDate().toISOString() : new Date().toISOString(),
        fechaRealizada: fechaRealizada,
      } as Visita;
    });
    callback(visitas);
  });
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
    } as Visita;
  });

  return visitas;
}

export async function marcarVisitaRealizada(visitaId: string, notas: string) {
  const visitaRef = doc(db, 'visitas', visitaId);
  await updateDoc(visitaRef, {
    estado: 'realizada',
    notas: notas,
    fechaRealizada: serverTimestamp(),
  });
}

export async function eliminarVisita(id: string) {
  if (!id) {
    throw new Error("Se requiere un ID de visita para eliminarla.");
  }

  const visitaRef = doc(db, "visitas", id);
  await deleteDoc(visitaRef);
};
