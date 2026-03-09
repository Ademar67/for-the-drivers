'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Loader2, MapPin, Navigation } from 'lucide-react';

type DenueSearchModalProps = {
  open: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
};

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
  id_denue?: string;

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

type PuntoMapa = {
  key: string;
  nombre: string;
  direccion: string;
  telefono: string;
  lat: number;
  lng: number;
  raw: DenueResult;
};

function buildDomicilio(d: DenueResult) {
  const calle = d.Calle || d.nom_vial || '';
  const ext = d.Num_Exterior || d.numero_ext ? ` ${d.Num_Exterior || d.numero_ext}` : '';
  const col = d.Colonia || d.colonia ? `, ${d.Colonia || d.colonia}` : '';
  return `${calle}${ext}${col}`.trim();
}

function getDenueKey(item: DenueResult): string {
  return String(
    item?.clee ??
      item?.Id ??
      item?.id ??
      item?.id_denue ??
      `${item?.nom_estab ?? item?.Nombre ?? 'x'}-${
        item?.latitud ?? item?.Latitud ?? ''
      }-${item?.longitud ?? item?.Longitud ?? ''}`
  );
}

function buildAddress(item: DenueResult) {
  return (
    item?.direccion ||
    [
      item?.nom_vial || item?.Calle,
      item?.numero_ext || item?.Num_Exterior,
      item?.colonia || item?.Colonia,
      item?.cod_postal,
      item?.municipio || item?.Municipio,
      item?.entidad,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function getDenueLat(item: DenueResult) {
  const lat = Number(item?.latitud ?? item?.lat ?? item?.Latitud ?? null);
  return Number.isFinite(lat) ? lat : null;
}

function getDenueLng(item: DenueResult) {
  const lng = Number(item?.longitud ?? item?.lng ?? item?.Longitud ?? null);
  return Number.isFinite(lng) ? lng : null;
}

export function useDenueAdd() {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  async function addFromDenue(item: DenueResult, category: 'taller' | 'refaccionaria') {
    const localId = getDenueKey(item);

    try {
      setAddingId(localId);

      const name =
        item?.nom_estab ?? item?.name ?? item?.Nombre ?? 'SIN NOMBRE';
      const phone =
        item?.telefono ?? item?.tel ?? item?.phone ?? item?.Telefono ?? null;
      const address = buildAddress(item) || buildDomicilio(item);

      const lat = getDenueLat(item);
      const lng = getDenueLng(item);

      const res = await fetch('/api/prospectos/from-denue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          lat,
          lng,
          category,
          denueRaw: item,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? 'No se pudo agregar el prospecto');
        return false;
      }

      setAddedIds((prev) => ({ ...prev, [localId]: true }));

      alert(
        data.created
          ? '✅ Prospecto agregado'
          : 'ℹ️ Ya existía, no se duplicó'
      );

      return true;
    } catch (error) {
      console.error('Error agregando prospecto DENUE:', error);
      alert('No se pudo agregar el prospecto');
      return false;
    } finally {
      setAddingId(null);
    }
  }

  return { addFromDenue, addingId, addedIds };
}

export default function DenueSearchModal({
  open,
  onClose,
  coords,
}: DenueSearchModalProps) {
  const [searchType, setSearchType] = useState<'taller' | 'refaccionaria'>('taller');
  const [results, setResults] = useState<DenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addFromDenue, addingId, addedIds } = useDenueAdd();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const puntosMapa = useMemo<PuntoMapa[]>(() => {
    return results
      .map((item) => {
        const lat = getDenueLat(item);
        const lng = getDenueLng(item);

        if (lat === null || lng === null) return null;

        return {
          key: getDenueKey(item),
          nombre: item?.nom_estab ?? item?.name ?? item?.Nombre ?? 'SIN NOMBRE',
          direccion: buildAddress(item) || buildDomicilio(item) || 'Sin dirección',
          telefono:
            item?.telefono ?? item?.tel ?? item?.phone ?? item?.Telefono ?? 'No disponible',
          lat,
          lng,
          raw: item,
        };
      })
      .filter((item): item is PuntoMapa => item !== null);
  }, [results]);

  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;

    const initMap = () => {
      if (!mapRef.current || !(window as any).google?.maps) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: coords ?? { lat: 19.703, lng: -101.192 },
          zoom: 14,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        infoWindowRef.current = new google.maps.InfoWindow();
      } else if (coords) {
        mapInstanceRef.current.setCenter(coords);
      }
    };

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return () => {
        existingScript.removeEventListener('load', initMap);
      };
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [open, coords]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    if (coords) {
      const userMarker = new google.maps.Marker({
        position: coords,
        map,
        title: 'Tu ubicación',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      markersRef.current.push(userMarker);
      bounds.extend(coords);
    }

    puntosMapa.forEach((punto) => {
      const marker = new google.maps.Marker({
        position: { lat: punto.lat, lng: punto.lng },
        map,
        title: punto.nombre,
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(`
          <div style="padding:8px;max-width:240px;font-family:sans-serif;">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${punto.nombre}</div>
            <div style="font-size:12px;color:#444;margin-bottom:4px;">${punto.direccion}</div>
            <div style="font-size:12px;color:#666;">Tel: ${punto.telefono}</div>
          </div>
        `);
        infoWindowRef.current?.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: punto.lat, lng: punto.lng });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);

      if (puntosMapa.length === 0 && coords) {
        map.setZoom(15);
      }
    }
  }, [puntosMapa, coords, open]);

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
        throw new Error(clean || `Error ${response.status}`);
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

  function abrirEnGoogleMaps(item: DenueResult) {
    const lat = getDenueLat(item);
    const lng = getDenueLng(item);

    if (lat !== null && lng !== null) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
      return;
    }

    const address =
      encodeURIComponent(buildAddress(item) || buildDomicilio(item) || item?.nom_estab || item?.Nombre || '');

    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, '_blank');
  }

  async function handleAddAndNavigate(item: DenueResult) {
    const ok = await addFromDenue(item, searchType);
    if (ok) {
      abrirEnGoogleMaps(item);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Buscar Negocios Cercanos en DENUE</DialogTitle>
          <DialogDescription>
            Encuentra talleres mecánicos o refaccionarias cerca de tu ubicación.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <RadioGroup
              value={searchType}
              onValueChange={(val: any) => setSearchType(val)}
              className="flex flex-col gap-2 sm:flex-row sm:gap-6"
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {loading && (
                <p className="text-center text-gray-500">Buscando...</p>
              )}

              {error && (
                <p className="text-center text-red-500">{error}</p>
              )}

              {!loading && !error && results.length === 0 && (
                <p className="text-center text-gray-500">
                  No se encontraron resultados.
                </p>
              )}

              {results.map((item) => {
                const keyId = getDenueKey(item);
                const domicilio = buildAddress(item) || buildDomicilio(item);
                const telefono =
                  item?.telefono ??
                  item?.tel ??
                  item?.phone ??
                  item?.Telefono ??
                  'No disponible';

                const isAdding = addingId === keyId;
                const isAdded = !!addedIds[keyId];

                return (
                  <div
                    key={keyId}
                    className="p-3 border rounded-lg flex flex-col gap-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {item?.nom_estab ?? item?.name ?? item?.Nombre ?? 'SIN NOMBRE'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {domicilio || 'Sin dirección'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tel: {telefono}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFromDenue(item, searchType)}
                        disabled={isAdding || isAdded}
                      >
                        {isAdded
                          ? 'Agregado ✅'
                          : isAdding
                          ? 'Agregando...'
                          : 'Agregar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAddAndNavigate(item)}
                        disabled={isAdding}
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        {isAdding ? 'Agregando...' : 'Agregar + Navegar'}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => abrirEnGoogleMaps(item)}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Ver en Maps
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border rounded-lg overflow-hidden h-[60vh] bg-muted">
              <div ref={mapRef} className="w-full h-full" />
            </div>
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