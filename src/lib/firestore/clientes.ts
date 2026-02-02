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
  tipo: 'cliente' | 'prospecto' | 'inactivo'
  ciudad: string
  domicilio: string
  diaVisita: string | null
  frecuencia: string | null

  // OJO: createdAt casi siempre es Timestamp, pero por seguridad lo manejamos bien.
  createdAt: Timestamp

  // Opcionales
  nota?: string
  lat?: number
  lng?: number
  origen?: string

  denue?: {
    id: string
    actividad?: string
    fechaImportado: Timestamp
  }

  // updatedAt puede ser Timestamp o FieldValue (serverTimestamp)
  updatedAt?: Timestamp | FieldValue
}

// ==============================
// LISTEN (Realtime)
// ==============================
export function listenClientes(callback: (clientes: ClienteFS[]) => void) {
  const q = query(collection(db, 'clientes'), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const clientes = snapshot.docs.map((d) => {
      const data: any = d.data()

      return {
        id: d.id,
        nombre: data.nombre ?? '',
        ciudad: data.ciudad ?? '',
        domicilio: data.domicilio ?? '',
        tipo: (data.tipo ?? 'prospecto') as ClienteFS['tipo'],
        diaVisita: data.diaVisita ?? null,
        frecuencia: data.frecuencia ?? null,

        // si viene null/undefined, no truena
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

// ==============================
// CREAR CLIENTE / PROSPECTO MANUAL
// ==============================
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

// ==============================
// DENUE -> CREAR PROSPECTO
// (evita duplicados por denue.id)
// ==============================
export async function crearProspectoDesdeDenue(denueBusiness: any) {
  if (!denueBusiness) {
    throw new Error('Datos de negocio de DENUE inválidos.')
  }

  // DENUE a veces manda "Id" (mayúscula) en lugar de "id"
  const denueId: string =
    String(denueBusiness.id ?? denueBusiness.Id ?? denueBusiness.ID ?? '').trim()

  if (!denueId) {
    throw new Error('DENUE no trae ID del negocio.')
  }

  // 1) Evitar duplicados: si ya existe un cliente con denue.id == denueId, no crear.
  const existingQ = query(
    collection(db, 'clientes'),
    where('denue.id', '==', denueId)
  )
  const existingSnap = await getDocs(existingQ)
  if (!existingSnap.empty) {
    // Ya existe, regresamos sin duplicar.
    return { ok: true, alreadyExists: true, id: existingSnap.docs[0].id }
  }

  const direccionCompleta = [
    denueBusiness.Calle,
    denueBusiness.Num_Exterior,
    denueBusiness.Num_Interior,
    denueBusiness.Colonia,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()

  const lat = Number.parseFloat(String(denueBusiness.Latitud ?? '').trim())
  const lng = Number.parseFloat(String(denueBusiness.Longitud ?? '').trim())

  const prospectoData = {
    nombre: String(denueBusiness.Nombre ?? '').trim() || 'Prospecto DENUE',
    tipo: 'prospecto' as const,
    ciudad: String(denueBusiness.Municipio ?? '').trim() || 'N/A',
    domicilio: direccionCompleta || 'N/A',
    diaVisita: null,
    frecuencia: null,

    nota: `Importado desde DENUE.${denueBusiness.Clase_actividad ? ` Actividad: ${denueBusiness.Clase_actividad}.` : ''}`,

    // solo guardamos coords si son válidas
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,

    origen: 'DENUE',
    denue: {
      id: denueId,
      actividad: denueBusiness.Clase_actividad ?? undefined,
      fechaImportado: Timestamp.now(),
    },

    createdAt: Timestamp.now(),
  }

  const ref = await addDoc(collection(db, 'clientes'), prospectoData)
  return { ok: true, alreadyExists: false, id: ref.id }
}

// ==============================
// ELIMINAR
// ==============================
export async function eliminarCliente(id: string) {
  if (!id) {
    throw new Error('Se requiere un ID de cliente para eliminarlo.')
  }
  const clienteRef = doc(db, 'clientes', id)
  await deleteDoc(clienteRef)
}

// ==============================
// CAMBIAR TIPO
// ==============================
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