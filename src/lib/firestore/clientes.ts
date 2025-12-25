import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Cliente = {
  id: string;
  nombre: string;
  ciudad: string;
  tipo: 'Cliente' | 'Prospecto' | 'Inactivo';
};

export async function getClientes(): Promise<Cliente[]> {
  const snap = await getDocs(collection(db, 'clientes'));

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: data.nombre ?? '',
      ciudad: data.ciudad ?? '',
      tipo: data.tipo ?? 'Prospecto',
    };
  });
}
