'use client';

import { useEffect, useRef, useState } from 'react';
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
import { Calendar, Trash2, Upload } from 'lucide-react';
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteFS[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>

        <div className="flex gap-2">
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
          >
            <Upload className="mr-2 h-4 w-4" />
            {importando ? 'Importando...' : 'Importar Excel'}
          </Button>

          <Button variant="secondary" onClick={exportarCSV}>
            Exportar a CSV
          </Button>

          <Button onClick={() => setOpen(true)}>+ Agregar cliente</Button>
        </div>
      </div>

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
      ) : clientes.length === 0 ? (
        <p className="mt-8 text-center italic text-gray-500">
          No hay clientes registrados.
        </p>
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            {clientes.map((c) => (
              <div key={c.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="items-start gap-3 justify-between flex">
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
                    <span className="font-medium text-gray-500">Zona:</span>{' '}
                    {c.tipoZona ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Ciudad:</span>{' '}
                    {c.ciudad}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Día visita:</span>{' '}
                    {c.diaVisita ?? '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Semana:</span>{' '}
                    {c.semanaVisita ? `Semana ${c.semanaVisita}` : '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Frecuencia:</span>{' '}
                    {c.frecuencia ?? '—'}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row">
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

          <div className="hidden rounded-md border md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Zona</th>
                  <th className="p-3 text-left">Ciudad</th>
                  <th className="p-3 text-left">Día visita</th>
                  <th className="p-3 text-left">Semana</th>
                  <th className="p-3 text-left">Frecuencia</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3 capitalize">{c.tipo}</td>
                    <td className="p-3 capitalize">{c.tipoZona ?? '—'}</td>
                    <td className="p-3">{c.ciudad}</td>
                    <td className="p-3">{c.diaVisita ?? '—'}</td>
                    <td className="p-3">
                      {c.semanaVisita ? `Semana ${c.semanaVisita}` : '—'}
                    </td>
                    <td className="p-3">{c.frecuencia ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agenda?clienteId=${c.id}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <Calendar className="h-4 w-4" />
                          Ver Agenda
                        </Link>

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