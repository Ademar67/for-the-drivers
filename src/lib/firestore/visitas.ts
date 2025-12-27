
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
  doc,
  getDoc,
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
  createdAt: Timestamp;
  lat?: number;
  lng?: number;
};

type CrearVisitaInput = Omit<Visita, 'id' | 'createdAt' | 'lat' | 'lng'>;

export async function crearVisita(visita: CrearVisitaInput) {
  let lat, lng;

  // Obtener las coordenadas del cliente
  if (visita.clienteId) {
    const clienteRef = doc(db, 'clientes', visita.clienteId);
    const clienteSnap = await getDoc(clienteRef);

    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      lat = clienteData.lat; // Puede ser undefined si no existe
      lng = clienteData.lng; // Puede ser undefined si no existe
    }
  }

  const docRef = await addDoc(collection(db, 'visitas'), {
    ...visita,
    lat,
    lng,
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
      clienteId: data.clienteId,
      fecha: data.fecha,
      hora: data.hora,
      tipo: data.tipo,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.createdAt,
      lat: data.lat,
      lng: data.lng,
    } as Visita;
  });

  return visitas;
}
