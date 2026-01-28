import { db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

export type ClienteFS = {
  id?: string
  nombre: string
  tipo: 'cliente' | 'prospecto' | 'inactivo'
  ciudad: string
  domicilio: string
  diaVisita: string | null
  frecuencia: string | null
  createdAt: Timestamp
  nota?: string
}

// Escuchar clientes en tiempo real
export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const q = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        nombre: data.nombre ?? '',
        ciudad: data.ciudad ?? '',
        domicilio: data.domicilio ?? '',
        tipo: (data.tipo ?? 'prospecto') as ClienteFS['tipo'],
        diaVisita: data.diaVisita ?? null,
        frecuencia: data.frecuencia ?? null,
        createdAt: data.createdAt,
        nota: data.nota ?? '',
      }
    }) as ClienteFS[]

    callback(clientes)
  })
}

export async function crearCliente(input: {
  nombre: string
  ciudad: string
  domicilio: string
  tipo: 'cliente' | 'prospecto' | 'inactivo'
  diaVisita: string | null
  frecuencia: string | null
  nota: string
}) {
  if (!input.nombre || !input.nombre.trim()) {
    throw new Error('El nombre es obligatorio')
  }

  if (!input.ciudad || !input.ciudad.trim()) {
    throw new Error('La ciudad es obligatoria')
  }

  await addDoc(collection(db, 'clientes'), {
    nombre: input.nombre.trim(),
    ciudad: input.ciudad.trim(),
    domicilio: (input.domicilio ?? '').trim(),
    tipo: input.tipo,
    diaVisita: input.diaVisita,
    frecuencia: input.frecuencia,
    nota: (input.nota ?? '').trim(),
    createdAt: Timestamp.now(),
  })
}

export async function eliminarCliente(id: string) {
  if (!id) {
    throw new Error('Se requiere un ID de cliente para eliminarlo.')
  }
  const clienteRef = doc(db, 'clientes', id)
  await deleteDoc(clienteRef)
}

export async function cambiarTipoCliente(
  id: string,
  tipo: 'prospecto' | 'cliente' | 'inactivo'
) {
  if (!id) throw new Error('Falta id del cliente/prospecto')

  const ref = doc(db, 'clientes', id)

  await updateDoc(ref, {
    tipo,
    updatedAt: serverTimestamp(),
  })
}
