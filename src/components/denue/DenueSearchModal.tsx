'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type DenueSearchModalProps = {
  open: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
};

// 👇 OJO: DENUE normalmente usa "Id" (mayúscula), no "id"
export type DenueResult = {
  Id?: string;
  id?: string;
  clee?: string;
  nom_estab?: string;
  name?: string;
  nom_vial?: string;
  numero_ext?: string;
  colonia?: string;
  cod_postal?: string;
  municipio?: string;
  entidad?: string;
  telefono?: string;
  tel?: string;
  phone?: string;
  latitud?: string;
  longitud?: string;
  lat?: string;
  lng?: string;
  direccion?: string;

  // Campos “normalizados” (los que tú estás usando para pintar)
  Nombre: string;
  Calle: string;
  Num_Exterior?: string;
  Num_Interior?: string;
  Colonia?: string;
  Municipio?: string;
  Telefono?: string;
  Latitud?: string;
  Longitud?: string;
  Clase_actividad?: string;
};

function buildDomicilio(d: DenueResult) {
  const ext = d.Num_Exterior ? ` ${d.Num_Exterior}` : '';
  const col = d.Colonia ? `, ${d.Colonia}` : '';
  return `${d.Calle || ''}${ext}${col}`.trim();
}

function getDenueKey(d: DenueResult) {
  // 1) Id oficial si viene
  const id = d.Id || d.id;
  if (id) return String(id);

  // 2) clee si viene (también es buen id)
  if (d.clee) return String(d.clee);

  // 3) fallback para evitar undefined
  const lat = d.Latitud || '';
  const lng = d.Longitud || '';
  return `${d.Nombre}-${lat}-${lng}`.replace(/\s+/g, '-');
}

function buildAddress(item: any) {
  return (
    item?.direccion ||
    [item?.nom_vial, item?.numero_ext, item?.colonia, item?.cod_postal, item?.municipio, item?.entidad]
      .filter(Boolean)
      .join(' ')
  );
}

export function useDenueAdd() {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  async function addFromDenue(item: any, category: 'taller' | 'refaccionaria') {
    const localId =
      item?.id ||
      item?.id_denue ||
      item?.clee ||
      `${item?.nom_estab ?? item?.Nombre ?? 'x'}-${item?.latitud ?? item?.Latitud ?? ''}-${item?.longitud ?? item?.Longitud ?? ''}`;

    try {
      const localIdStr = String(localId);
      setAddingId(localIdStr);

      const name = item?.nom_estab ?? item?.name ?? item?.Nombre ?? 'SIN NOMBRE';
      const phone = item?.telefono ?? item?.tel ?? item?.phone ?? item?.Telefono ?? null;
      const address = buildAddress(item) || buildDomicilio(item);

      const lat = Number(item?.latitud ?? item?.lat ?? item?.Latitud ?? null);
      const lng = Number(item?.longitud ?? item?.lng ?? item?.Longitud ?? null);

      const res = await fetch('/api/prospectos/from-denue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          lat: Number.isFinite(lat) ? lat : null,
          lng: Number.isFinite(lng) ? lng : null,
          category,
          denueRaw: item,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? 'No se pudo agregar el prospecto');
        return;
      }

      setAddedIds((prev) => ({ ...prev, [localIdStr]: true }));

      alert(data.created ? '✅ Prospecto agregado' : 'ℹ️ Ya existía, no se duplicó');
    } finally {
      setAddingId(null);
    }
  }

  return { addFromDenue, addingId, addedIds };
}

export default function DenueSearchModal({ open, onClose, coords }: DenueSearchModalProps) {
  const [searchType, setSearchType] = useState<'taller' | 'refaccionaria'>('taller');
  const [results, setResults] = useState<DenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addFromDenue, addingId, addedIds } = useDenueAdd();

  const handleSearch = async () => {
    if (!coords) {
      setError('No hay coordenadas disponibles (GPS).');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { lat, lng } = coords;

      const response = await fetch(
        `/api/denue/search?lat=${lat}&lng=${lng}&tipo=${searchType}&radius=1000`,
        { cache: 'no-store' }
      );

      const text = await response.text();
      const clean = text.trim().replace(/^﻿/, '');

      if (!response.ok) {
        try {
          const errJson = JSON.parse(clean);
          throw new Error(errJson.details || errJson.error || `Error ${response.status}`);
        } catch {
          throw new Error(clean || `Error ${response.status}`);
        }
      }

      const data = JSON.parse(clean);
      const arr: DenueResult[] = Array.isArray(data) ? data : [];
      setResults(arr);
    } catch (e: any) {
      setError(e?.message || 'Error al buscar en DENUE.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Negocios Cercanos en DENUE</DialogTitle>
          <DialogDescription>Encuentra talleres mecánicos o refaccionarias cerca de tu ubicación.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-6">
            <RadioGroup defaultValue="taller" value={searchType} onValueChange={(val: any) => setSearchType(val)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="taller" id="r-taller" />
                <Label htmlFor="r-taller">Talleres Mecánicos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="refaccionaria" id="r-refaccionaria" />
                <Label htmlFor="r-refaccionaria">Refaccionarias</Label>
              </div>
            </RadioGroup>

            <Button onClick={handleSearch} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
            {loading && <p className="text-center text-gray-500">Buscando...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && results.length === 0 && (
              <p className="text-center text-gray-500">No se encontraron resultados.</p>
            )}

            {results.map((item) => {
              const key = getDenueKey(item);
              const domicilio = buildDomicilio(item);

              // ✅ ID seguro para UI (nunca undefined)
              const keyId = String(item?.clee ?? item?.Id ?? item?.id ?? key);
              const isAdding = addingId === keyId;
              const isAdded = !!addedIds[keyId];

              return (
                <div key={key} className="p-3 border rounded-lg flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold">{item.Nombre}</p>
                    <p className="text-sm text-gray-600">{domicilio || 'Sin dirección'}</p>
                    <p className="text-xs text-gray-500">Tel: {item.Telefono || 'No disponible'}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addFromDenue(item, searchType)}
                    disabled={isAdding || isAdded}
                  >
                    {isAdded ? 'Agregado ✅' : isAdding ? 'Agregando...' : 'Agregar'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}