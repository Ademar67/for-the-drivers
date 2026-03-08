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
  FieldValue,
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

  updatedAt?: Timestamp | FieldValue
}

export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const q = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((d) => {
      const data: any = d.data()

      return {
        id: d.id,
        nombre: data.nombre ?? '',
        email: data.email ?? undefined,
        telefono: data.telefono ?? undefined,
        ciudad: data.ciudad ?? '',
        domicilio: data.domicilio ?? '',
        tipo: (data.tipo ?? 'prospecto') as ClienteFS['tipo'],
        tipoZona: (data.tipoZona ?? undefined) as ClienteFS['tipoZona'],
        diaVisita: data.diaVisita ?? null,
        frecuencia: data.frecuencia ?? null,
        semanaVisita:
          typeof data.semanaVisita === 'number' ? data.semanaVisita : null,
        createdAt: data.createdAt ?? Timestamp.now(),
        nota: data.nota ?? '',
        lat: typeof data.lat === 'number' ? data.lat : undefined,
        lng: typeof data.lng === 'number' ? data.lng : undefined,
        origen: data.origen ?? undefined,
        denue: data.denue ?? undefined,
        updatedAt: data.updatedAt ?? undefined,
      } as ClienteFS
    })

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
  if (!input.nombre || !input.nombre.trim()) {
    throw new Error('El nombre es obligatorio')
  }

  if (!input.ciudad || !input.ciudad.trim()) {
    throw new Error('La ciudad es obligatoria')
  }

  if (!input.tipoZona) {
    throw new Error('El tipo de zona es obligatorio')
  }

  if (
    input.semanaVisita != null &&
    ![1, 2, 3, 4].includes(input.semanaVisita)
  ) {
    throw new Error('La semana de visita debe ser 1, 2, 3 o 4')
  }

  if (input.tipoZona === 'foraneo' && input.semanaVisita != null) {
    if (![1, 4].includes(input.semanaVisita)) {
      throw new Error('Los clientes foráneos solo pueden ser semana 1 o 4')
    }
  }

  if (input.tipoZona === 'local' && input.semanaVisita != null) {
    if (![2, 3].includes(input.semanaVisita)) {
      throw new Error('Los clientes locales solo pueden ser semana 2 o 3')
    }
  }

  await addDoc(collection(db, 'clientes'), {
    nombre: input.nombre.trim(),
    ciudad: input.ciudad.trim(),
    domicilio: (input.domicilio ?? '').trim(),
    tipo: input.tipo,
    tipoZona: input.tipoZona,
    diaVisita: input.diaVisita,
    frecuencia: input.frecuencia,
    semanaVisita: input.semanaVisita,
    nota: (input.nota ?? '').trim(),
    lat: typeof input.lat === 'number' ? input.lat : null,
    lng: typeof input.lng === 'number' ? input.lng : null,
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
  if (!input || !input.denueId) {
    throw new Error('Datos de negocio de DENUE inválidos o sin ID.')
  }

  const denueId = input.denueId.trim()

  const existingQ = query(
    collection(db, 'clientes'),
    where('denue.id', '==', denueId)
  )
  const existingSnap = await getDocs(existingQ)
  if (!existingSnap.empty) {
    return { ok: true, alreadyExists: true, id: existingSnap.docs[0].id }
  }

  const prospectoData = {
    nombre: input.nombre || 'Prospecto DENUE',
    tipo: 'prospecto' as const,
    tipoZona: undefined,
    ciudad: input.ciudad || 'N/A',
    domicilio: input.domicilio || 'N/A',
    diaVisita: null,
    frecuencia: null,
    semanaVisita: null,
    nota: `Importado desde DENUE.${input.claseActividad ? ` Actividad: ${input.claseActividad}.` : ''}`,
    lat: input.lat != null && Number.isFinite(input.lat) ? input.lat : undefined,
    lng: input.lng != null && Number.isFinite(input.lng) ? input.lng : undefined,
    origen: 'DENUE',
    denue: {
      id: denueId,
      actividad: input.claseActividad || undefined,
      tipoNegocio: input.tipoNegocio,
      fechaImportado: Timestamp.now(),
    },
    createdAt: Timestamp.now(),
  }

  const ref = await addDoc(collection(db, 'clientes'), prospectoData)
  return { ok: true, alreadyExists: false, id: ref.id }
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