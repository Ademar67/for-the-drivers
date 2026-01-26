
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listenClientes, ClienteFS, eliminarCliente } from '@/lib/firestore/clientes';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import { db } from '@/lib/firebase';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = listenClientes(setClientes);
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await eliminarCliente(id);
      // La lista se refresca automáticamente gracias al listener onSnapshot
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      alert("No se pudo eliminar el cliente.");
    }
  };

  const exportarCSV = () => {
    if (!clientes || clientes.length === 0) {
      alert('No hay clientes para exportar.');
      return;
    }

    const headers = ['Nombre', 'Tipo', 'Ciudad', 'Día visita', 'Frecuencia'];
    const data = clientes.map((c) => [
      c.nombre,
      c.tipo,
      c.ciudad,
      c.diaVisita || '—',
      c.frecuencia || '—',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...data.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clientes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!clientes) {
    return <div className="p-6">Cargando clientes...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Exportar a CSV
          </button>
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Agregar cliente
          </button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Ciudad</th>
              <th className="p-3 text-left">Día visita</th>
              <th className="p-3 text-left">Frecuencia</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.nombre}</td>
                <td className="p-3">{c.tipo}</td>
                <td className="p-3">{c.ciudad}</td>
                <td className="p-3">{c.diaVisita ?? '—'}</td>
                <td className="p-3">{c.frecuencia ?? '—'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agenda?clienteId=${c.id}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                    >
                      <Calendar className="h-4 w-4" />
                      Ver Agenda
                    </Link>
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
                            Esta acción no se puede deshacer. Se eliminará permanentemente al cliente "{c.nombre}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id!)} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
