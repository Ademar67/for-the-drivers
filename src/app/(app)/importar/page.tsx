'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthProvider';

type Registro = Record<string, any>;

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Geocodificar domicilio → lat/lng
async function geocodeAddress(domicilio: string, ciudad: string) {
  if (!GOOGLE_API_KEY) return null;
  const address = encodeURIComponent(`${domicilio}, ${ciudad}`);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (
      data.status === 'OK' &&
      data.results &&
      data.results[0] &&
      data.results[0].geometry &&
      data.results[0].geometry.location
    ) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch (e) {
    console.error('Error geocoding', e);
    return null;
  }
}

// Mapa de días: lo que usamos en importador → lo que espera el mapa
const DIA_MAP: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

export default function ImportarPage() {
  const [rows, setRows] = useState<Registro[]>([]);
  const [tipo, setTipo] = useState<'cliente' | 'prospecto'>('prospecto');
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);

  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-sm text-red-600">
        Debes iniciar sesión para importar clientes/prospectos.
      </div>
    );
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // CSV
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            setRows(results.data as Registro[]);
            setLoading(false);
          },
        });
        return;
      }

      // Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setRows(jsonData as Registro[]);
    } catch (error) {
      console.error(error);
      alert('Error leyendo archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleImportar = async () => {
    if (!rows.length) return;

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

    // según el select: 'cliente' | 'prospecto'
    const coleccionDestino = tipo === 'cliente' ? 'clientes' : 'prospectos';

    try {
      setImportando(true);

      let creados = 0;
      let duplicados = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const nombre =
          row.nombre ||
          row.Nombre ||
          row.NOMBRE ||
          'Sin nombre';

        const telefonoRaw =
          row.telefono ||
          row.Telefono ||
          row['Teléfono'] ||
          row.celular ||
          row.Celular ||
          '';

        const telefono = String(telefonoRaw).trim();

        const email = row.email || row.Email || '';
        const ciudad = row.ciudad || row.Ciudad || '';
        const domicilio =
          row.domicilio ||
          row.Domicilio ||
          row.direccion ||
          row['Dirección'] ||
          '';

        // Duplicados por teléfono en colección destino
        if (telefono) {
          const dupQuery = query(
            collection(db, coleccionDestino),
            where('telefono', '==', telefono),
            limit(1)
          );

          const dupSnap = await getDocs(dupQuery);

          if (!dupSnap.empty) {
            duplicados++;
            continue; // saltar registro
          }
        }

        // 15 visitas por día
        const bloque = Math.floor(i / 15);

        // lunes-viernes (interno)
        const diaVisitaKey = dias[bloque % 5]; // 'lunes', 'martes', etc.

        // Formato que espera el mapa: 'Lunes', 'Martes', 'Miércoles', ...
        const diaVisita = DIA_MAP[diaVisitaKey] ?? 'Lunes';

        // semanas rotativas 1-4
        const semanaVisita =
          (Math.floor(bloque / 5) % 4) + 1;

        // Geocodificar (si tenemos domicilio y ciudad)
        let lat: number | null = null;
        let lng: number | null = null;

        if (domicilio && ciudad) {
          const coords = await geocodeAddress(domicilio, ciudad);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }

        await addDoc(
          collection(db, coleccionDestino),
          {
            ownerId: user.uid,
            ownerEmail: user.email ?? '',

            nombre,
            telefono,
            email,
            ciudad,
            domicilio,

            tipo,

            diaVisita,      // <- ya en el formato del mapa
            semanaVisita,   // seguirá para futuras vistas

            lat: lat ?? null,
            lng: lng ?? null,

            origen: 'excel-import',

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            timeline: [
              {
                ownerId: user.uid,
                tipo: 'importacion',
                texto: '📥 Importado desde Excel',
                createdAt: new Date(),
              },
            ],
          }
        );

        creados++;
      }

      alert(
        `Importación completada 🚀\n` +
        `Colección: ${coleccionDestino}\n` +
        `Nuevos creados: ${creados}\n` +
        `Duplicados por teléfono (saltados): ${duplicados}`
      );
    } catch (error) {
      console.error(error);
      alert('Error importando registros');
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Importar Clientes / Prospectos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sube un archivo Excel o CSV
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) =>
                setTipo(
                  e.target.value as
                    | 'cliente'
                    | 'prospecto'
                )
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="cliente">
                Clientes
              </option>
              <option value="prospecto">
                Prospectos
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Archivo Excel / CSV
            </label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFile}
              className="block w-full rounded-xl border border-slate-300 p-3"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
          Procesando archivo...
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Previsualización
              </h2>
              <p className="text-sm text-slate-500">
                {rows.length} registros encontrados
              </p>
            </div>

            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleImportar}
              disabled={importando}
            >
              {importando ? 'Importando...' : 'Importar'}
            </button>
          </div>

          <div className="overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">
                    Nombre
                  </th>
                  <th className="px-3 py-2 text-left">
                    Teléfono
                  </th>
                  <th className="px-3 py-2 text-left">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left">
                    Ciudad
                  </th>
                  <th className="px-3 py-2 text-left">
                    Domicilio
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows
                  .slice(0, 20)
                  .map((row, idx) => {
                    const nombre =
                      row.nombre ||
                      row.Nombre ||
                      row.NOMBRE;

                    const telefono =
                      row.telefono ||
                      row.Telefono ||
                      row['Teléfono'] ||
                      row.celular ||
                      row.Celular;

                    const email =
                      row.email ||
                      row.Email;

                    const ciudad =
                      row.ciudad ||
                      row.Ciudad ||
                      row.municipio;

                    const domicilio =
                      row.domicilio ||
                      row.Domicilio ||
                      row.direccion ||
                      row['Dirección'];

                    return (
                      <tr
                        key={idx}
                        className="border-t"
                      >
                        <td className="px-3 py-2">
                          {nombre}
                        </td>
                        <td className="px-3 py-2">
                          {telefono}
                        </td>
                        <td className="px-3 py-2">
                          {email}
                        </td>
                        <td className="px-3 py-2">
                          {ciudad}
                        </td>
                        <td className="px-3 py-2">
                          {domicilio}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {rows.length > 20 && (
            <p className="mt-3 text-xs text-slate-500">
              Mostrando primeros 20 registros
            </p>
          )}
        </div>
      )}
    </div>
  );
}
