'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import {
  listenClientes,
  ClienteFS,
  eliminarCliente,
} from '@/lib/firestore/clientes';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CrearClienteModal from '@/components/clientes/crear-cliente-modal';
import {
  Calendar,
  Trash2,
  Upload,
  Download,
  Users,
  MapPin,
  UserCheck,
  UserX,
} from 'lucide-react';
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

type ExcelClienteRow = {
  'No Cliente SAI'?: string | number;
  'NOMBRE DE CUENTA'?: string;
  Calle?: string;
  Numero?: string | number;
  COLONIA?: string;
  'CIUDAD DE FACTURACION'?: string;
  'CÓDIGO DE FACTURACIÓN'?: string | number;
  'CODIGO DE FACTURACION'?: string | number;
  ESTADO?: string;
  'TELÉFONO'?: string | number;
  'TELEFONO'?: string | number;
  'Correo Electronico'?: string;
  'TIPO DE CUENTA'?: string;
  Coordenadas?: string;
  'DÍA DE VISITA'?: string;
  'DIA DE VISITA'?: string;
  'FRECUENCIA DE VISITA'?: string;
  CLIENTE?: string;
  [key: string]: string | number | undefined;
};

function getTipoBadgeClasses(tipo?: string) {
  switch (tipo) {
    case 'cliente':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'prospecto':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'inactivo':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getZonaBadgeClasses(zona?: string) {
  switch (zona) {
    case 'foraneo':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'local':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importando, setImportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = listenClientes((clientes) => {
      setClientes(clientes);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    if (!term) return clientes;

    return clientes.filter((c) => {
      return (
        (c.nombre ?? '').toLowerCase().includes(term) ||
        (c.ciudad ?? '').toLowerCase().includes(term) ||
        (c.tipo ?? '').toLowerCase().includes(term) ||
        (c.tipoZona ?? '').toLowerCase().includes(term)
      );
    });
  }, [clientes, busqueda]);

  const totalClientes = clientesFiltrados.length;
  const totalActivos = clientesFiltrados.filter((c) => c.tipo !== 'inactivo').length;
  const totalInactivos = clientesFiltrados.filter((c) => c.tipo === 'inactivo').length;
  const totalForaneos = clientesFiltrados.filter((c) => c.tipoZona === 'foraneo').length;

  const handleDelete = async (id: string) => {
    try {
      await eliminarCliente(id);
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

    const headers = [
      'Nombre',
      'Tipo',
      'Zona',
      'Ciudad',
      'Día visita',
      'Semana visita',
      'Frecuencia',
    ];

    const rows = clientes.map((c) => [
      c.nombre ?? '—',
      c.tipo ?? '—',
      c.tipoZona ?? '—',
      c.ciudad ?? '—',
      c.diaVisita ?? '—',
      c.semanaVisita ?? '—',
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

  const limpiarTexto = (valor: unknown) => String(valor ?? '').trim();

  const parseCoordenadas = (valor: string) => {
    if (!valor) return { lat: null, lng: null };

    const limpio = valor.trim().replace(/\s+/g, '');
    const partes = limpio.split(',');

    if (partes.length !== 2) return { lat: null, lng: null };

    const lat = Number(partes[0]);
    const lng = Number(partes[1]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return { lat: null, lng: null };
    }

    return { lat, lng };
  };

  const normalizarDiaVisita = (valor: string) => {
    const dia = valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    const validos = [
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
    ];

    if (validos.includes(dia)) return dia;
    return '';
  };

  const normalizarFrecuencia = (valor: string) => {
    const frecuencia = valor.toLowerCase().trim();

    if (frecuencia.includes('seman')) return 'semanal';
    if (frecuencia.includes('quin')) return 'quincenal';
    if (frecuencia.includes('mens')) return 'mensual';

    return 'mensual';
  };

  const calcularSemanaVisita = (dia: string) => {
    const texto = dia.toLowerCase();

    const match = texto.match(/semana\s*(\d)/i);
    if (match) {
      const semana = Number(match[1]);
      if (semana >= 1 && semana <= 4) return semana;
    }

    return 1;
  };

  const obtenerTipo = (row: ExcelClienteRow) => {
    const dia = limpiarTexto(row['DÍA DE VISITA'] ?? row['DIA DE VISITA']);
    const tipoCuenta = limpiarTexto(row['TIPO DE CUENTA']);

    if (dia.toUpperCase() === 'INACTIVO' || tipoCuenta.toUpperCase().includes('INACT')) {
      return 'inactivo';
    }

    return 'cliente';
  };

  const obtenerZona = (valor: string) => {
    return valor.toUpperCase().includes('FORANEO') ? 'foraneo' : 'local';
  };

  const handleImportClientes = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportando(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ExcelClienteRow>(sheet);

      if (!rows.length) {
        alert('El archivo no tiene filas válidas.');
        return;
      }

      let creados = 0;
      let omitidos = 0;

      for (const row of rows) {
        const nombre = limpiarTexto(row['NOMBRE DE CUENTA']);
        const ciudad = limpiarTexto(row['CIUDAD DE FACTURACION']);
        const calle = limpiarTexto(row['Calle']);
        const numero = limpiarTexto(row['Numero']);
        const colonia = limpiarTexto(row['COLONIA']);
        const domicilio = [calle, numero, colonia].filter(Boolean).join(' ');
        const telefono = limpiarTexto(row['TELÉFONO'] ?? row['TELEFONO']);
        const email = limpiarTexto(row['Correo Electronico']);
        const zona = obtenerZona(limpiarTexto(row['CLIENTE']));
        const diaOriginal = limpiarTexto(row['DÍA DE VISITA'] ?? row['DIA DE VISITA']);
        const diaVisita = normalizarDiaVisita(diaOriginal);
        const frecuencia = normalizarFrecuencia(
          limpiarTexto(row['FRECUENCIA DE VISITA'])
        );
        const semanaVisita = calcularSemanaVisita(diaOriginal);
        const tipo = obtenerTipo(row);
        const codigoCliente = limpiarTexto(row['No Cliente SAI']);
        const codigoPostal = limpiarTexto(
          row['CÓDIGO DE FACTURACIÓN'] ?? row['CODIGO DE FACTURACION']
        );
        const estado = limpiarTexto(row['ESTADO']);
        const tipoCuenta = limpiarTexto(row['TIPO DE CUENTA']);
        const { lat, lng } = parseCoordenadas(limpiarTexto(row['Coordenadas']));

        if (!nombre || !ciudad) {
          omitidos++;
          continue;
        }

        const clienteExistenteQuery = query(
          collection(db, 'clientes'),
          where('nombre', '==', nombre)
        );
        const clienteExistenteSnap = await getDocs(clienteExistenteQuery);

        const yaExiste = clienteExistenteSnap.docs.some((doc) => {
          const data = doc.data() as ClienteFS;
          return (data.ciudad ?? '').trim().toLowerCase() === ciudad.toLowerCase();
        });

        if (yaExiste) {
          omitidos++;
          continue;
        }

        await addDoc(collection(db, 'clientes'), {
          nombre,
          ciudad,
          domicilio,
          telefono,
          email,
          tipoZona: zona,
          diaVisita: diaVisita || null,
          frecuencia,
          semanaVisita,
          tipo,
          codigoCliente,
          codigoPostal,
          estado,
          tipoCuenta,
          notaVisita: '',
          notas: '',
          activo: tipo !== 'inactivo',
          lat,
          lng,
          createdAt: Timestamp.now(),
        });

        creados++;
      }

      alert(`Importación terminada.\nCreados: ${creados}\nOmitidos: ${omitidos}`);
    } catch (error) {
      console.error('Error al importar clientes:', error);
      alert('No se pudo importar el Excel de clientes.');
    } finally {
      setImportando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tu cartera, agenda de visitas e importación masiva.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportClientes}
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importando}
            className="rounded-xl"
          >
            <Upload className="mr-2 h-4 w-4" />
            {importando ? 'Importando...' : 'Importar Excel'}
          </Button>

          <Button variant="secondary" onClick={exportarCSV} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          <Button onClick={() => setOpen(true)} className="rounded-xl">
            + Agregar cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Clientes</p>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalClientes}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Activos</p>
            <UserCheck className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalActivos}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Inactivos</p>
            <UserX className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalInactivos}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Foráneos</p>
            <MapPin className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalForaneos}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Listado de clientes</h2>
            <p className="text-sm text-slate-500">
              Busca por nombre, ciudad, tipo o zona.
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <label className="mb-1 block text-sm font-medium">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Refaccionaria, Monterrey, foraneo..."
              className="w-full rounded-xl border bg-white px-3 py-3 outline-none"
            />
          </div>
        </div>

        {!loading && (
          <p className="mt-4 text-sm text-slate-500">
            {clientesFiltrados.length} resultado
            {clientesFiltrados.length === 1 ? '' : 's'}
          </p>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Image
              src="/liquimoly-logo-v4.png"
              alt="Cargando..."
              width={128}
              height={128}
              className="animate-pulse"
              priority
            />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-slate-50 p-10 text-center">
            <h3 className="text-lg font-semibold">
              {clientes.length === 0
                ? 'Aún no hay clientes registrados'
                : 'No hay resultados con esa búsqueda'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {clientes.length === 0
                ? 'Agrega tu primer cliente o importa un archivo de Excel para comenzar.'
                : 'Prueba con otro nombre, ciudad, tipo o zona.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-4 md:hidden">
              {clientesFiltrados.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800">
                        {c.nombre}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{c.ciudad}</p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn('capitalize', getTipoBadgeClasses(c.tipo))}
                    >
                      {c.tipo ?? '—'}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Zona</p>
                      <p className="mt-1 font-medium capitalize">
                        {c.tipoZona ?? '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Frecuencia</p>
                      <p className="mt-1 font-medium capitalize">
                        {c.frecuencia ?? '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Día visita</p>
                      <p className="mt-1 font-medium capitalize">
                        {c.diaVisita ?? '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">Semana</p>
                      <p className="mt-1 font-medium">
                        {c.semanaVisita ? `Semana ${c.semanaVisita}` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn('capitalize', getZonaBadgeClasses(c.tipoZona))}
                    >
                      {c.tipoZona ?? '—'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row">
                    <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
                      <Link href={`/agenda?clienteId=${c.id}`}>
                        <Calendar className="h-4 w-4" />
                        Agenda
                      </Link>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="lg"
                          className="w-full rounded-xl"
                        >
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

            <div className="mt-6 hidden overflow-hidden rounded-2xl border md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-4 text-left text-sm font-semibold">Nombre</th>
                    <th className="p-4 text-left text-sm font-semibold">Tipo</th>
                    <th className="p-4 text-left text-sm font-semibold">Zona</th>
                    <th className="p-4 text-left text-sm font-semibold">Ciudad</th>
                    <th className="p-4 text-left text-sm font-semibold">Día visita</th>
                    <th className="p-4 text-left text-sm font-semibold">Semana</th>
                    <th className="p-4 text-left text-sm font-semibold">Frecuencia</th>
                    <th className="p-4 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {clientesFiltrados.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-slate-50/70">
                      <td className="p-4 font-medium">{c.nombre}</td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={cn('capitalize', getTipoBadgeClasses(c.tipo))}
                        >
                          {c.tipo ?? '—'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={cn('capitalize', getZonaBadgeClasses(c.tipoZona))}
                        >
                          {c.tipoZona ?? '—'}
                        </Badge>
                      </td>
                      <td className="p-4">{c.ciudad}</td>
                      <td className="p-4 capitalize">{c.diaVisita ?? '—'}</td>
                      <td className="p-4">
                        {c.semanaVisita ? `Semana ${c.semanaVisita}` : '—'}
                      </td>
                      <td className="p-4 capitalize">{c.frecuencia ?? '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href={`/agenda?clienteId=${c.id}`}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Agenda
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl text-red-500 hover:text-red-700"
                              >
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
      </section>

      <CrearClienteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}