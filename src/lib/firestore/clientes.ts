import { collection, getDocs, addDoc } from 'firebase/firestore';
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

export async function crearCliente(input: {
  nombre: string;
  ciudad: string;
  tipo: 'Cliente' | 'Prospecto' | 'Inactivo';
}) {
  if (!input.nombre.trim()) {
    throw new Error('El nombre es obligatorio');
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
