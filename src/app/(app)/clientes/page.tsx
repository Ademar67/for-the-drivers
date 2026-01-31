'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { listenClientes, ClienteFS, eliminarCliente } from '@/lib/firestore/clientes';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenClientes((clientes) => {
      setClientes(clientes);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await eliminarCliente(id);
      // La lista se refresca automáticamente gracias al listener onSnapshot
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      alert('No se pudo eliminar el cliente.');
    }
  };

  const escapeCSV = (value: unknown) => {
    const s = String(value ?? '');
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const exportarCSV = () => {
    if (!clientes.length) {
      alert('No hay clientes para exportar.');
      return;
    }

    const headers = ['Nombre', 'Tipo', 'Ciudad', 'Día visita', 'Frecuencia'];

    const rows = clientes.map((c) => [
      c.nombre ?? '—',
      c.tipo ?? '—',
      c.ciudad ?? '—',
      c.diaVisita ?? '—',
      c.frecuencia ?? '—',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportarCSV}>
            Exportar a CSV
          </Button>

          <Button onClick={() => setOpen(true)}>+ Agregar cliente</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20">
            <Image
              src="/logo-liqui-moly.png"
              alt="Cargando..."
              width={120}
              height={120}
              className="animate-pulse"
              priority
            />
            <p className="text-muted-foreground mt-4">Cargando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
         <p className="text-gray-500 italic text-center mt-8">No hay clientes registrados.</p>
      ) : (
        <>
          {/* ✅ Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {clientes.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-lg font-bold text-gray-800">{c.nombre}</h3>

                  <Badge
                    variant={c.tipo === 'cliente' ? 'secondary' : 'outline'}
                    className={cn(
                      'capitalize',
                      c.tipo === 'prospecto' && 'border-green-500 text-green-700',
                      c.tipo === 'inactivo' && 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {c.tipo}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-500">Ciudad:</span> {c.ciudad}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Día visita:</span> {c.diaVisita ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Frecuencia:</span> {c.frecuencia ?? '—'}
                  </p>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 border-t pt-3">
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link href={`/agenda?clienteId=${c.id}`}>
                      <Calendar className="h-4 w-4" />
                      Agenda
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="lg" className="w-full">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
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
                        <AlertDialogAction
                          onClick={() => handleDelete(c.id!)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Desktop View: Table */}
          <div className="hidden md:block rounded-md border">
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
                    <td className="p-3 capitalize">{c.tipo}</td>
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
                              <AlertDialogAction
                                onClick={() => handleDelete(c.id!)}
                                className="bg-red-600 hover:bg-red-700"
                              >
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
        </>
      )}

      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
