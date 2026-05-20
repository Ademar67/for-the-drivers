'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Trash2, Upload } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Producto = {
  id: string
  categoria: string
  codigo: string
  nombre: string
  capacidad: string
  precio: number
  activo: boolean
}

type ExcelRow = {
  CODIGO?: string | number
  PRODUCTO?: string
  ENVASE?: string
  [key: string]: string | number | undefined
}

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([])
  const [open, setOpen] = useState(false)
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function cargarProductos() {
    const snap = await getDocs(collection(db, 'productos'))
    const data = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Producto, 'id'>),
    }))
    setProductos(data)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'productos', id))
      await cargarProductos()
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      alert("No se pudo eliminar el producto.")
    }
  }

  const normalizarCategoria = (nombre: string) => {
    const text = nombre.toLowerCase()

    if (
      text.includes('5w') ||
      text.includes('10w') ||
      text.includes('15w') ||
      text.includes('20w') ||
      text.includes('sae') ||
      text.includes('leichtlauf') ||
      text.includes('molygen') ||
      text.includes('top tec') ||
      text.includes('special tec') ||
      text.includes('diesel') ||
      text.includes('marine')
    ) {
      return 'Aceites'
    }

    if (
      text.includes('flush') ||
      text.includes('ceratec') ||
      text.includes('mos2') ||
      text.includes('motor protect') ||
      text.includes('injector') ||
      text.includes('limpiador') ||
      text.includes('tratamiento')
    ) {
      return 'Tratamientos'
    }

    if (
      text.includes('coolant') ||
      text.includes('anticongelante') ||
      text.includes('brems') ||
      text.includes('frenos') ||
      text.includes('radiator')
    ) {
      return 'Mantenimiento'
    }

    return 'Aceites'
  }

  const parsePrecio = (value: string | number | undefined) => {
    if (typeof value === 'number') return value
    if (!value) return 0

    const limpio = String(value).replace(/[$,\s]/g, '')
    const numero = Number(limpio)

    return isNaN(numero) ? 0 : numero
  }

  const obtenerPrecioDesdeFila = (row: ExcelRow) => {
    const clavesPosibles = [
      'PRECIO MAYOREO MÁS IVA',
      'PRECIO MAYOREO MAS IVA',
      'PRECIO MAYOREO\nMÁS IVA',
      'PRECIO MAYOREO\nMAS IVA',
    ]

    for (const clave of clavesPosibles) {
      const valor = row[clave]
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        return parsePrecio(valor)
      }
    }

    for (const key of Object.keys(row)) {
      const keyNormalizada = key.replace(/\s+/g, ' ').trim().toUpperCase()
      if (
        keyNormalizada.includes('PRECIO MAYOREO') &&
        keyNormalizada.includes('IVA')
      ) {
        return parsePrecio(row[key])
      }
    }

    return 0
  }

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImportando(true)

      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet)

      if (!rows.length) {
        alert('El archivo no tiene filas válidas.')
        return
      }

      let creados = 0
      let omitidos = 0

      for (const row of rows) {
        const codigo = String(row.CODIGO ?? '').trim()
        const nombre = String(row.PRODUCTO ?? '').trim()
        const capacidad = String(row.ENVASE ?? '').trim()
        const precio = obtenerPrecioDesdeFila(row)

        if (!codigo || !nombre || !capacidad || !precio) {
          omitidos++
          continue
        }

        const categoria = normalizarCategoria(nombre)

        const existenteQuery = query(
          collection(db, 'productos'),
          where('codigo', '==', codigo)
        )
        const existenteSnap = await getDocs(existenteQuery)

        if (!existenteSnap.empty) {
          omitidos++
          continue
        }

        await addDoc(collection(db, 'productos'), {
          categoria,
          codigo,
          nombre,
          capacidad,
          precio,
          activo: true,
          createdAt: Timestamp.now(),
        })

        creados++
      }

      await cargarProductos()

      alert(
        `Importación terminada.\nCreados: ${creados}\nOmitidos: ${omitidos}`
      )
    } catch (error) {
      console.error('Error importando Excel:', error)
      alert('No se pudo importar el Excel.')
    } finally {
      setImportando(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="text-xl font-semibold">Productos</h1>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded border px-4 py-2"
            disabled={importando}
          >
            <Upload className="h-4 w-4" />
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>

          <button
            onClick={() => setOpen(true)}
            className="rounded bg-black px-4 py-2 text-white"
          >
            + Añadir producto
          </button>
        </div>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay productos aún. Añade el primero.
        </p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-left">Capacidad</th>
              <th className="p-2 text-right">Precio</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono">{p.codigo}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.categoria}</td>
                <td className="p-2">{p.capacidad}</td>
                <td className="p-2 text-right">${p.precio.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{p.nombre}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-red-600 hover:bg-red-700">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && (
        <ProductoModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            cargarProductos()
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function ProductoModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [categoria, setCategoria] = useState('Aceites')
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [precio, setPrecio] = useState('')

  const capacidadesAceite = ['1L', '5L', '60L', '200L', '205L']
  const capacidadesAnticongelante = ['1L', '5L', '200L']

  const capacidades =
    categoria === 'Aceites'
      ? capacidadesAceite
      : categoria === 'Mantenimiento'
      ? capacidadesAnticongelante
      : ['N/A']

  async function guardar() {
    if (!codigo || !nombre || !capacidad || !precio) {
      alert('Completa todos los campos')
      return
    }

    await addDoc(collection(db, 'productos'), {
      categoria,
      codigo,
      nombre,
      capacidad,
      precio: Number(precio),
      activo: true,
      createdAt: Timestamp.now(),
    })

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md space-y-3 rounded bg-white p-6">
        <h2 className="text-lg font-semibold">Añadir producto</h2>

        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded border p-2">
          <option>Aceites</option>
          <option>Tratamientos</option>
          <option>Mantenimiento</option>
          <option>Cuidado de automóvil</option>
        </select>

        <input
          placeholder="Código del producto"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          className="w-full rounded border p-2"
        />

        <input
          placeholder="Nombre del producto"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full rounded border p-2"
        />

        <select value={capacidad} onChange={e => setCapacidad(e.target.value)} className="w-full rounded border p-2">
          <option value="">Capacidad</option>
          {capacidades.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Precio (IVA incluido)"
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          className="w-full rounded border p-2"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded border px-4 py-2">Cancelar</button>
          <button
            onClick={guardar}
            className="rounded bg-black px-4 py-1 text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}