'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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

type DenueResult = {
  id: string;
  Nombre: string;
  Calle: string;
  Num_Exterior: string;
  Num_Interior: string;
  Colonia: string;
  Municipio: string;
  Telefono: string;
  Latitud: string;
  Longitud: string;
  Clase_actividad: string;
};

export default function DenueSearchModal({ open, onClose, coords }: DenueSearchModalProps) {
  const [searchType, setSearchType] = useState<'taller' | 'refaccionaria'>('taller');
  const [results, setResults] = useState<DenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedProspects, setAddedProspects] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { lat, lng } = coords;
      const response = await fetch(`/api/denue/search?lat=${lat}&lng=${lng}&tipo=${searchType}&radius=1000`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al buscar en DENUE.');
      }
      const data = await response.json();
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAgregarProspecto = async (business: DenueResult) => {
    setAddedProspects(prev => new Set(prev).add(business.id)); // Optimistic UI
    try {
        await crearProspectoDesdeDenue(business);
    } catch (error) {
        console.error('Error al agregar prospecto:', error);
        alert('No se pudo agregar el prospecto.');
        setAddedProspects(prev => {
            const newSet = new Set(prev);
            newSet.delete(business.id);
            return newSet;
        });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Negocios Cercanos en DENUE</DialogTitle>
          <DialogDescription>
            Encuentra talleres mecánicos o refaccionarias cerca de la ubicación de tu visita.
          </DialogDescription>
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
            {!loading && !error && results.length === 0 && <p className="text-center text-gray-500">No se encontraron resultados.</p>}
            
            {results.map(item => (
                <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center gap-3">
                    <div className="flex-1">
                        <p className="font-semibold">{item.Nombre}</p>
                        <p className="text-sm text-gray-600">{item.Calle} {item.Num_Exterior}, {item.Colonia}</p>
                        <p className="text-xs text-gray-500">Tel: {item.Telefono || 'No disponible'}</p>
                    </div>
                    <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => handleAgregarProspecto(item)}
                        disabled={addedProspects.has(item.id)}
                    >
                       {!addedProspects.has(item.id) ? (
                        <>
                           <PlusCircle className="mr-2 h-4 w-4"/> Agregar
                        </>
                       ) : 'Agregado'}
                    </Button>
                </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
