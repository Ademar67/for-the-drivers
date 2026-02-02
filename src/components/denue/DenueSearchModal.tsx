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
import { PlusCircle, Loader2 } from 'lucide-react';
import { crearProspectoDesdeDenue } from '@/lib/firestore/clientes';

type DenueSearchModalProps = {
  open: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
};

// 👇 OJO: DENUE normalmente usa "Id" (mayúscula), no "id"
export type DenueResult = {
  Id?: string;
  id?: string;

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
  if (id) return id;

  // 2) fallback por si DENUE no manda Id en algún caso (evita undefined)
  const lat = d.Latitud || '';
  const lng = d.Longitud || '';
  return `${d.Nombre}-${lat}-${lng}`.replace(/\s+/g, '-');
}

export default function DenueSearchModal({ open, onClose, coords }: DenueSearchModalProps) {
  const [searchType, setSearchType] = useState<'taller' | 'refaccionaria'>('taller');
  const [results, setResults] = useState<DenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedProspects, setAddedProspects] = useState<Set<string>>(new Set());

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
      const clean = text.trim().replace(/^\uFEFF/, '');

      if (!response.ok) {
        // intenta parsear error JSON, si no, muestra el texto
        try {
          const errJson = JSON.parse(clean);
          throw new Error(errJson.details || errJson.error || `Error ${response.status}`);
        } catch {
          throw new Error(clean || `Error ${response.status}`);
        }
      }

      const data = JSON.parse(clean);

      // A veces DENUE regresa objeto, a veces array. Nos vamos a array.
      const arr: DenueResult[] = Array.isArray(data) ? data : [];
      setResults(arr);
    } catch (e: any) {
      setError(e?.message || 'Error al buscar en DENUE.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProspecto = async (business: DenueResult) => {
    const key = getDenueKey(business);

    // Optimistic UI
    setAddedProspects((prev) => new Set(prev).add(key));

    try {
      await crearProspectoDesdeDenue({
        denueId: key,
        nombre: business.Nombre,
        telefono: business.Telefono || '',
        ciudad: business.Municipio || '',
        domicilio: buildDomicilio(business),
        lat: business.Latitud ? Number(business.Latitud) : null,
        lng: business.Longitud ? Number(business.Longitud) : null,
        claseActividad: business.Clase_actividad || '',
        tipoNegocio: searchType, // "taller" | "refaccionaria"
      });
    } catch (err) {
      console.error('Error al agregar prospecto:', err);
      alert('No se pudo agregar el prospecto.');

      // rollback optimistic
      setAddedProspects((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Negocios Cercanos en DENUE</DialogTitle>
          <DialogDescription>
            Encuentra talleres mecánicos o refaccionarias cerca de tu ubicación.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-6">
            <RadioGroup
              defaultValue="taller"
              value={searchType}
              onValueChange={(val: any) => setSearchType(val)}
            >
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
                    onClick={() => handleAgregarProspecto(item)}
                    disabled={addedProspects.has(key)}
                  >
                    {!addedProspects.has(key) ? (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Agregar
                      </>
                    ) : (
                      'Agregado'
                    )}
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