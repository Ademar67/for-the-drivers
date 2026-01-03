
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Factura } from '@/lib/firebase-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, CircleDollarSign, Clock, CheckCircle, Trash2 } from 'lucide-react';
import CrearFacturaModal from '@/components/facturas/crear-factura-modal';
import { listenClientes, ClienteFS } from '@/lib/firestore/clientes';
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

// Función para actualizar el estado de las facturas vencidas
async function actualizarFacturasVencidas(facturas: Factura[]) {
  const hoy = new Date();
  const batch: Promise<void>[] = [];

  facturas.forEach(factura => {
    if (factura.estado === 'pendiente' && factura.fechaVencimiento.toDate() < hoy) {
      const facturaRef = doc(db, 'facturas', factura.id);
      batch.push(updateDoc(facturaRef, { estado: 'vencida' }));
    }
  });

  if (batch.length > 0) {
    await Promise.all(batch);
    console.log(`${batch.length} facturas actualizadas a 'vencida'.`);
  }
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'facturas'), orderBy('fechaVencimiento', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const facturasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Factura));
      
      actualizarFacturasVencidas(facturasData).then(() => {
        // El listener ya se encarga de recibir los datos actualizados,
        // pero podemos forzar la re-evaluación si es necesario.
        // Aquí simplemente seteamos los datos que ya recibimos.
         setFacturas(facturasData);
         setLoading(false);
      });
    });

    const unsubClientes = listenClientes(setClientes);

    return () => {
        unsubscribe();
        unsubClientes();
    };
  }, []);
  
  const handleGuardarFactura = async (data: any) => {
     try {
        await addDoc(collection(db, 'facturas'), {
            ...data,
            estado: 'pendiente',
            fecha: Timestamp.fromDate(new Date(data.fecha)),
            fechaVencimiento: Timestamp.fromDate(new Date(data.fechaVencimiento)),
        });
        setOpenModal(false);
    } catch (error) {
        console.error("Error al crear la factura:", error);
    }
  }

  const marcarComoPagada = async (id: string) => {
    const facturaRef = doc(db, 'facturas', id);
    await updateDoc(facturaRef, { estado: 'pagada' });
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'facturas', id));
      // La tabla se actualizará automáticamente gracias al listener onSnapshot
    } catch (error) {
      console.error("Error al eliminar la factura:", error);
      alert("No se pudo eliminar la factura.");
    }
  };

  const { totalPorCobrar, totalVencido } = facturas.reduce(
    (acc, f) => {
      if (f.estado === 'pendiente' || f.estado === 'vencida') {
        acc.totalPorCobrar += f.monto;
      }
      if (f.estado === 'vencida') {
        acc.totalVencido += f.monto;
      }
      return acc;
    },
    { totalPorCobrar: 0, totalVencido: 0 }
  );

  const columns: ColumnDef<Factura>[] = [
    {
      accessorKey: 'folio',
      header: 'Folio',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.folio}</span>,
    },
    {
      accessorKey: 'clienteNombre',
      header: 'Cliente',
    },
    {
      accessorKey: 'fecha',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Fecha Emisión
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(row.original.fecha.toDate(), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'fechaVencimiento',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Fecha Vencimiento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(row.original.fechaVencimiento.toDate(), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'monto',
      header: ({ column }) => (
        <div className="text-right">
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Monto
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.original.monto.toLocaleString('es-MX')}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.estado;
        return (
          <Badge
            variant={
              estado === 'pagada' ? 'default' : estado === 'vencida' ? 'destructive' : 'secondary'
            }
            className={
                estado === 'pagada' ? 'bg-green-100 text-green-800' :
                estado === 'vencida' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
            }
          >
            {estado}
          </Badge>
        );
      },
    },
     {
      id: 'actions',
      cell: ({ row }) => {
        const factura = row.original;
        return (
            <div className="flex items-center justify-end gap-2">
            {factura.estado !== 'pagada' && (
              <Button variant="outline" size="sm" onClick={() => marcarComoPagada(factura.id)}>
                Marcar Pagada
              </Button>
            )}
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
                    Esta acción no se puede deshacer. Se eliminará permanentemente la factura con folio {factura.folio}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(factura.id)} className="bg-red-600 hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Panel de Cobranza</h1>
        <Button onClick={() => setOpenModal(true)}>+ Nueva Factura</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPorCobrar.toLocaleString('es-MX')}</div>
            <p className="text-xs text-muted-foreground">Suma de facturas pendientes y vencidas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalVencido.toLocaleString('es-MX')}</div>
             <p className="text-xs text-muted-foreground">Suma de facturas con pago retrasado.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facturas.filter(f => f.estado === 'pagada').length}
            </div>
             <p className="text-xs text-muted-foreground">Total de facturas liquidadas.</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={facturas}
        isLoading={loading}
        filterColumnId="clienteNombre"
        filterPlaceholder="Filtrar por cliente..."
      />

      <CrearFacturaModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleGuardarFactura}
        clientes={clientes}
      />
    </div>
  );
}
