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
  getDocs,
  where,
} from 'firebase/firestore'

export type ClienteFS = {
  id?: string
  nombre: string
  email?: string
  telefono?: string
  tipo: 'cliente' | 'prospecto' | 'inactivo'
  tipoZona?: 'local' | 'foraneo'
  ciudad: string
  domicilio: string
  diaVisita: string | null
  frecuencia: string | null
  semanaVisita?: number | null
  createdAt: Timestamp
  nota?: string
  lat?: number
  lng?: number
  origen?: string
  denue?: {
    id: string
    actividad?: string
    tipoNegocio?: 'taller' | 'refaccionaria'
    fechaImportado: Timestamp
  }
  updatedAt?: Timestamp
}

export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const q = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }))

    callback(clientes)
  })
}

export async function crearCliente(input: {
  nombre: string
  ciudad: string
  domicilio: string
  tipo: 'cliente' | 'prospecto' | 'inactivo'
  tipoZona: 'local' | 'foraneo'
  diaVisita: string | null
  frecuencia: string | null
  semanaVisita: number | null
  nota: string
  lat?: number | null
  lng?: number | null
}) {
  await addDoc(collection(db, 'clientes'), {
    nombre: input.nombre.trim(),
    ciudad: input.ciudad.trim(),
    domicilio: input.domicilio.trim(),
    tipo: input.tipo,
    tipoZona: input.tipoZona,
    diaVisita: input.diaVisita,
    frecuencia: input.frecuencia,
    semanaVisita: input.semanaVisita,
    nota: input.nota,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    createdAt: Timestamp.now(),
  })
}

export async function crearProspectoDesdeDenue(input: {
  denueId: string
  nombre: string
  telefono: string
  ciudad: string
  domicilio: string
  lat: number | null
  lng: number | null
  claseActividad: string
  tipoNegocio: 'taller' | 'refaccionaria'
}) {
  if (!input || !input.denueId?.trim()) {
    throw new Error('Datos de negocio de DENUE inválidos o sin ID.')
  }

  const denueId = input.denueId.trim()

  const existingQ = query(
    collection(db, 'clientes'),
    where('denue.id', '==', denueId)
  )

  const existingSnap = await getDocs(existingQ)

  if (!existingSnap.empty) {
    return {
      ok: true,
      alreadyExists: true,
      id: existingSnap.docs[0].id,
    }
  }

  const prospectoData: Record<string, any> = {
    nombre: input.nombre?.trim() || 'Prospecto DENUE',
    tipo: 'prospecto',
    ciudad: input.ciudad?.trim() || 'N/A',
    domicilio: input.domicilio?.trim() || 'N/A',
    diaVisita: null,
    frecuencia: null,
    semanaVisita: null,
    nota: `Importado desde DENUE.${
      input.claseActividad?.trim()
        ? ` Actividad: ${input.claseActividad.trim()}.`
        : ''
    }`,
    origen: 'DENUE',
    denue: {
      id: denueId,
      tipoNegocio: input.tipoNegocio,
      fechaImportado: Timestamp.now(),
    },
    createdAt: Timestamp.now(),
  }

  if (input.telefono?.trim()) {
    prospectoData.telefono = input.telefono.trim()
  }

  if (typeof input.lat === 'number') {
    prospectoData.lat = input.lat
  }

  if (typeof input.lng === 'number') {
    prospectoData.lng = input.lng
  }

  if (input.claseActividad?.trim()) {
    prospectoData.denue.actividad = input.claseActividad.trim()
  }

  const ref = await addDoc(collection(db, 'clientes'), prospectoData)

  return {
    ok: true,
    alreadyExists: false,
    id: ref.id,
  }
}

export async function eliminarCliente(id: string) {
  if (!id) {
    throw new Error('Se requiere un ID de cliente para eliminarlo.')
  }

  await deleteDoc(doc(db, 'clientes', id))
}

export async function cambiarTipoCliente(
  id: string,
  tipo: 'prospecto' | 'cliente' | 'inactivo'
) {
  if (!id) {
    throw new Error('Falta id del cliente')
  }

  await updateDoc(doc(db, 'clientes', id), {
    tipo,
    updatedAt: serverTimestamp(),
  })
}