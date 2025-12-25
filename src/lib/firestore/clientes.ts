import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export type ClienteFS = {
  id?: string;
  nombre: string;
  tipo: 'cliente' | 'prospecto' | 'inactivo';
  ciudad: string;
  domicilio: string;
  diaVisita: string;
  frecuencia: string;
  createdAt: Timestamp;
};

// Crear cliente (SIN update, SIN delete)
export async function crearCliente(data: Omit<ClienteFS, 'createdAt'>) {
  await addDoc(collection(db, 'clientes'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

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
