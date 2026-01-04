'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, Timestamp, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [open, setOpen] = useState(false)

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
      await deleteDoc(doc(db, 'productos', id));
      await cargarProductos(); // Recargar productos después de eliminar
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      alert("No se pudo eliminar el producto.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Productos</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Añadir producto
        </button>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay productos aún. Añade el primero.
        </p>
      ) : (
        <table className="w-full text-sm border">
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
            cargarProductos();
            setOpen(false);
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-full max-w-md space-y-3">
        <h2 className="font-semibold text-lg">Añadir producto</h2>

        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border p-2 rounded">
          <option>Aceites</option>
          <option>Tratamientos</option>
          <option>Mantenimiento</option>
          <option>Cuidado de automóvil</option>
        </select>

        <input
          placeholder="Código del producto"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Nombre del producto"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <select value={capacidad} onChange={e => setCapacidad(e.target.value)} className="w-full border p-2 rounded">
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
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button
            onClick={guardar}
            className="bg-black text-white px-4 py-1 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
