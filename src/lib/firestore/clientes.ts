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

  if (typeof input.lat === 'number' && Number.isFinite(input.lat)) {
    prospectoData.lat = input.lat
  }

  if (typeof input.lng === 'number' && Number.isFinite(input.lng)) {
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