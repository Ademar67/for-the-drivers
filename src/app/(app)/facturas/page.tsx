'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  Timestamp,
  addDoc,
  deleteDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthProvider';
import type { Factura } from '@/lib/firebase-types';
import type { ClienteFS } from '@/lib/firestore/clientes';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  CircleDollarSign,
  Clock,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import CrearFacturaModal from '@/components/facturas/crear-factura-modal';
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

type FacturaFS = Factura & {
  id?: string;
  ownerId?: string;
  ownerEmail?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toDateSafe(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }

  if (value instanceof Date) return value;

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateSafe(value: unknown) {
  const date = toDateSafe(value);
  if (!date) return '—';
  return format(date, 'dd/MM/yyyy');
}

function montoSeguro(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function actualizarFacturasVencidas(facturas: FacturaFS[]) {
  const hoy = new Date();

  const updates = facturas
    .filter((factura) => {
      const fechaVencimiento = toDateSafe(factura.fechaVencimiento);
      return (
        factura.estado === 'pendiente' &&
        fechaVencimiento !== null &&
        fechaVencimiento < hoy &&
        Boolean(factura.id)
      );
    })
    .map((factura) =>
      updateDoc(doc(db, 'facturas', factura.id!), {
        estado: 'vencida',
        updatedAt: serverTimestamp(),
      })
    );

  if (updates.length > 0) {
    try {
      await Promise.all(updates);
      console.log(`${updates.length} facturas actualizadas a vencida.`);
    } catch (error) {
      console.error('Error actualizando facturas vencidas:', error);
    }
  }
}

export default function FacturasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [facturas, setFacturas] = useState<FacturaFS[]>([]);
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setFacturas([]);
      setClientes([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const facturasRef = collection(db, 'facturas');
    const clientesRef = collection(db, 'clientes');

    const facturasQuery = query(
      facturasRef,
      where('ownerId', '==', user.uid)
    );
    const clientesQuery = query(
      clientesRef,
      where('ownerId', '==', user.uid)
    );

    const unsubscribeFacturas = onSnapshot(
      facturasQuery,
      async (snapshot) => {
        const facturasData = snapshot.docs.map(
          (documento) =>
            ({
              id: documento.id,
              ...documento.data(),
            }) as FacturaFS
        );

        facturasData.sort((a, b) => {
          const aDate = toDateSafe(a.fechaVencimiento)?.getTime() ?? 0;
          const bDate = toDateSafe(b.fechaVencimiento)?.getTime() ?? 0;
          return aDate - bDate;
        });

        if (!isMounted) return;

        setFacturas(facturasData);
        setLoading(false);

        await actualizarFacturasVencidas(facturasData);
      },
      (error) => {
        console.error('Error cargando facturas:', error);

        if (!isMounted) return;

        setFacturas([]);
        setLoading(false);
      }
    );

    const unsubscribeClientes = onSnapshot(
      clientesQuery,
      (snapshot) => {
        const clientesData = snapshot.docs.map(
          (documento) =>
            ({
              id: documento.id,
              ...documento.data(),
            }) as ClienteFS
        );

        clientesData.sort((a, b) =>
          String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es', {
            sensitivity: 'base',
          })
        );

        if (!isMounted) return;
        setClientes(clientesData);
      },
      (error) => {
        console.error('Error cargando clientes para cobranza:', error);
        if (!isMounted) return;
        setClientes([]);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeFacturas();
      unsubscribeClientes();
    };
  }, [user, authLoading]);

  const handleGuardarFactura = async (data: {
    folio: string;
    clienteId: string;
    clienteNombre?: string;
    monto: number | string;
    fecha: string;
    fechaVencimiento: string;
    pedidoId?: string;
  }) => {
    if (!user) {
      alert('Debes iniciar sesión para crear facturas.');
      return;
    }

    try {
      await addDoc(collection(db, 'facturas'), {
        ownerId: user.uid,
        ownerEmail: user.email ?? '',
        ...data,
        monto: montoSeguro(data.monto),
        estado: 'pendiente',
        fecha: Timestamp.fromDate(new Date(data.fecha)),
        fechaVencimiento: Timestamp.fromDate(new Date(data.fechaVencimiento)),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setOpenModal(false);
    } catch (error) {
      console.error('Error al crear la factura:', error);
      alert('No se pudo crear la factura.');
    }
  };

  const marcarComoPagada = async (id: string) => {
    if (!user) {
      alert('Debes iniciar sesión para actualizar facturas.');
      return;
    }

    try {
      const facturaRef = doc(db, 'facturas', id);
      await updateDoc(facturaRef, {
        estado: 'pagada',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      alert('No se pudo actualizar la factura.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      alert('Debes iniciar sesión para eliminar facturas.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'facturas', id));
    } catch (error) {
      console.error('Error al eliminar la factura:', error);
      alert('No se pudo eliminar la factura.');
    }
  };

  const { totalPorCobrar, totalVencido, totalPagadas } = useMemo(() => {
    return facturas.reduce(
      (acc, f) => {
        const monto = montoSeguro(f.monto);

        if (f.estado === 'pendiente' || f.estado === 'vencida') {
          acc.totalPorCobrar += monto;
        }

        if (f.estado === 'vencida') {
          acc.totalVencido += monto;
        }

        if (f.estado === 'pagada') {
          acc.totalPagadas += 1;
        }

        return acc;
      },
      { totalPorCobrar: 0, totalVencido: 0, totalPagadas: 0 }
    );
  }, [facturas]);

  const columns: ColumnDef<FacturaFS>[] = [
    {
      accessorKey: 'folio',
      header: 'Folio',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.folio ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'clienteNombre',
      header: 'Cliente',
      cell: ({ row }) => row.original.clienteNombre ?? '—',
    },
    {
      accessorKey: 'fecha',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha Emisión
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDateSafe(row.original.fecha),
      sortingFn: (rowA, rowB) => {
        const a = toDateSafe(rowA.original.fecha)?.getTime() ?? 0;
        const b = toDateSafe(rowB.original.fecha)?.getTime() ?? 0;
        return a - b;
      },
    },
    {
      accessorKey: 'fechaVencimiento',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha Vencimiento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDateSafe(row.original.fechaVencimiento),
      sortingFn: (rowA, rowB) => {
        const a = toDateSafe(rowA.original.fechaVencimiento)?.getTime() ?? 0;
        const b = toDateSafe(rowB.original.fechaVencimiento)?.getTime() ?? 0;
        return a - b;
      },
    },
    {
      accessorKey: 'monto',
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Monto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${montoSeguro(row.original.monto).toLocaleString('es-MX')}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = String(row.original.estado ?? 'pendiente').toLowerCase();

        return (
          <Badge
            variant={
              estado === 'pagada'
                ? 'default'
                : estado === 'vencida'
                ? 'destructive'
                : 'secondary'
            }
            className={
              estado === 'pagada'
                ? 'bg-green-100 text-green-800'
                : estado === 'vencida'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
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
            {factura.estado !== 'pagada' && factura.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => marcarComoPagada(factura.id!)}
              >
                Marcar Pagada
              </Button>
            )}

            {factura.id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente
                      la factura con folio {factura.folio}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(factura.id!)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  if (authLoading) {
    return <div className="space-y-6">Cargando cobranza...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
              <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="text-3xl font-bold">Panel de Cobranza</h1>
        <Button onClick={() => setOpenModal(true)} disabled={!user}>
          + Nueva Factura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPorCobrar.toLocaleString('es-MX')}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de facturas pendientes y vencidas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalVencido.toLocaleString('es-MX')}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de facturas con pago retrasado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPagadas}</div>
            <p className="text-xs text-muted-foreground">
              Total de facturas liquidadas.
            </p>
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