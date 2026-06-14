'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Building2, Phone, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

type DenueEstablishment = {
  Id: string;
  Nombre: string;
  Razon_social: string;
  Clase_actividad: string;
  Estrato: string;
  Tipo_vialidad: string;
  Calle: string;
  Num_Exterior: string;
  Num_Interior: string;
  Colonia: string;
  CP: string;
  Ubicacion: string;
  Telefono: string;
  Correo_e: string;
  Sitio_internet: string;
  Tipo: string;
  Longitud: string;
  Latitud: string;
};

interface DenueSearchModalProps {
  open: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
}

export default function DenueSearchModal({
  open,
  onClose,
  coords,
}: DenueSearchModalProps) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<'taller' | 'refaccionaria'>('taller');
  const [radio, setRadius] = useState('2000');
  const [results, setResults] = useState<DenueEstablishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/denue/search?lat=${coords.lat}&lng=${coords.lng}&radius=${radio}&tipo=${tipo}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching DENUE:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && coords && results.length === 0) {
      handleSearch();
    }
  }, [open, coords]);

  const handleAddProspecto = async (item: DenueEstablishment) => {
    if (!user) return;
    setAddingId(item.Id);
    try {
      const address = `${item.Calle} ${item.Num_Exterior}, ${item.Colonia}, ${item.CP}`;
      const res = await fetch('/api/prospectos/from-denue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.Nombre,
          address,
          phone: item.Telefono,
          lat: parseFloat(item.Latitud),
          lng: parseFloat(item.Longitud),
          category: tipo,
          denueRaw: item,
          ownerId: user.uid,
          ownerEmail: user.email,
        }),
      });

      if (res.ok) {
        alert('Prospecto agregado correctamente');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'No se pudo agregar'}`);
      }
    } catch (error) {
      console.error('Error adding prospecto:', error);
      alert('Error de red al agregar prospecto');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-blue-700 text-xl">
            <Search className="h-6 w-6" />
            Buscar Negocios Cercanos (DENUE)
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6 overflow-hidden flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="taller">Talleres Mecánicos</option>
                <option value="refaccionaria">Refaccionarias</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Radio de búsqueda</label>
              <select
                value={radio}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="500">500 m</option>
                <option value="1000">1 km</option>
                <option value="2000">2 km</option>
                <option value="5000">5 km</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar Negocios'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-slate-100 bg-slate-50 shadow-inner">
            {results.length === 0 && !loading ? (
              <div className="p-16 text-center text-slate-400">
                <Building2 className="mx-auto h-16 w-12 opacity-10 mb-4" />
                <p className="text-sm font-medium">No se encontraron resultados en el radio seleccionado.</p>
                <p className="text-xs mt-1">Prueba aumentando el radio o cambiando el tipo.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white">
                {results.map((item) => (
                  <div key={item.Id} className="p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 truncate text-sm">{item.Nombre}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.Calle} {item.Num_Exterior}, {item.Colonia}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {item.Telefono && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                            <Phone className="h-2.5 w-3" /> {item.Telefono}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                          <MapPin className="h-2.5 w-3" /> {item.Estrato}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 rounded-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      onClick={() => handleAddProspecto(item)}
                      disabled={addingId === item.Id}
                      title="Agregar como prospecto"
                    >
                      {addingId === item.Id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
