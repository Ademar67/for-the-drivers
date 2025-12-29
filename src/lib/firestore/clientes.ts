
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';

export type ClienteFS = {
  id?: string;
  nombre: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  ciudad: string;
  domicilio: string;
  diaVisita: string | null;
  frecuencia: string | null;
  createdAt: Timestamp;
};

// Escuchar clientes en tiempo real
export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const q = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre ?? '',
        ciudad: data.ciudad ?? '',
        domicilio: data.domicilio ?? '',
        tipo: data.tipo ?? 'prospecto',
        diaVisita: data.diaVisita ?? null,
        frecuencia: data.frecuencia ?? null,
        createdAt: data.createdAt
      };
    }) as ClienteFS[];
    callback(clientes);
  });
}

export async function crearCliente(input: {
  nombre: string;
  ciudad: string;
  domicilio: string,
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  diaVisita: string | null;
  frecuencia: string | null;
}) {
  if (!input.nombre || !input.nombre.trim()) {
    throw new Error('El nombre es obligatorio');
  }

  if (!input.ciudad || !input.ciudad.trim()) {
    throw new Error('La ciudad es obligatoria');
  }

  await addDoc(collection(db, 'clientes'), {
    nombre: input.nombre.trim(),
    ciudad: input.ciudad.trim(),
    domicilio: input.domicilio.trim(),
    tipo: input.tipo,
    diaVisita: input.diaVisita,
    frecuencia: input.frecuencia,
    createdAt: Timestamp.now(),
  });
}
