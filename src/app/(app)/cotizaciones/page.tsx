'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtenerCotizaciones, eliminarCotizacion, Cotizacion } from '@/lib/firestore/cotizaciones';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCotizaciones() {
    try {
      setLoading(true);
      const cots = await obtenerCotizaciones();
      setCotizaciones(cots);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCotizaciones();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await eliminarCotizacion(id);
      loadCotizaciones(); 
    } catch (error) {
      console.error("Error al eliminar la cotización:", error);
      alert("No se pudo eliminar la cotización.");
    }
  };

  const getEstadoBadge = (estado: 'pendiente' | 'aprobada' | 'rechazada') => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 capitalize">{estado}</Badge>;
      case 'aprobada':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 capitalize">{estado}</Badge>;
      case 'rechazada':
        return <Badge variant="destructive" className="capitalize">{estado}</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{estado}</Badge>;
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <Button asChild>
            <Link href="/cotizaciones/nueva">
              + Nueva Cotización
            </Link>
        </Button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : cotizaciones.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No hay cotizaciones registradas.</p>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {cotizaciones.map((cot) => (
              <Card key={cot.id} className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{cot.clienteNombre}</CardTitle>
                        <p className="text-sm text-blue-600 font-mono pt-1">
                          <Link href={`/cotizaciones/${cot.id}`}>{cot.id.substring(0, 7)}</Link>
                        </p>
                    </div>
                    {getEstadoBadge(cot.estado)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${cot.total.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(cot.fecha.toDate(), 'dd/MM/yyyy')}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/cotizaciones/${cot.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente la cotización.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cot.id)} className="bg-red-600 hover:bg-red-700">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block rounded-md border bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Folio</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cot) => (
                  <tr key={cot.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm text-blue-600">
                      <Link href={`/cotizaciones/${cot.id}`}>{cot.id.substring(0, 7)}</Link>
                    </td>
                    <td className="p-3">{cot.clienteNombre}</td>
                    <td className="p-3">
                      {format(cot.fecha.toDate(), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-3 font-medium">
                      ${cot.total.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                       cot.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                       cot.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                       'bg-red-100 text-red-800'
                     }`}>
                      {cot.estado}
                    </span>
                  </td>
                   <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/cotizaciones/${cot.id}`}>
                           <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente la cotización.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cot.id)} className="bg-red-600 hover:bg-red-700">
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
    </div>
  );
}
