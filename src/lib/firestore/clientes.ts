
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
export function listenClientes(
  callback: (clientes: ClienteFS[]) => void
) {
  const q = query(
    collection(db, 'clientes'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ClienteFS),
    }));
    callback(clientes);
  });
}

export async function crearCliente(input: {
  nombre: string;
  ciudad: string;
  tipo: 'Cliente' | 'Prospecto' | 'Inactivo';
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
    tipo: input.tipo,
    diaVisita: null,
    frecuencia: null,
    createdAt: new Date(),
  });
}
