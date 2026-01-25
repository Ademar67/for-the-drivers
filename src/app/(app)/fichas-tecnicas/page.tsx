
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FichaTecnica {
  id: string;
  name: string;
  category: 'Aceite' | 'Mantenimiento' | 'Tratamientos' | 'Desconocido';
  url: string;
}

const CATEGORIES = ['Todas', 'Aceite', 'Mantenimiento', 'Tratamientos'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const categoryBadgeClass: Record<FichaTecnica['category'], string> = {
  Aceite: 'bg-blue-100 text-blue-800 border-blue-200',
  Mantenimiento: 'bg-green-100 text-green-800 border-green-200',
  Tratamientos: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Desconocido: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function FichasTecnicasPage() {
  const [allFichas, setAllFichas] = useState<FichaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Todas');
  
  useEffect(() => {
    async function fetchFichas() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/fichas-tecnicas');
        if (!response.ok) {
          throw new Error('No se pudieron cargar las fichas técnicas.');
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setAllFichas(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFichas();
  }, []);


  const filteredFichas = useMemo(() => {
    return allFichas.filter(ficha => {
      const matchesCategory =
        activeCategory === 'Todas' || ficha.category === activeCategory;
      const matchesSearch = ficha.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, activeCategory, allFichas]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fichas Técnicas Liqui Moly</h1>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* CATÁLOGO */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg bg-white p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                 <Skeleton className="h-5 w-24" />
                 <Skeleton className="h-6 w-4/5" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg border-red-300 bg-red-50 text-red-700">
            <p className="font-semibold">Error al cargar</p>
            <p className="text-sm">{error}</p>
        </div>
      ) : filteredFichas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFichas.map(ficha => (
            <div
              key={ficha.id}
              className="border rounded-lg bg-white p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <Badge variant="outline" className={cn('mb-2', categoryBadgeClass[ficha.category])}>
                  {ficha.category}
                </Badge>
                <h3 className="font-semibold text-lg text-gray-800">{ficha.name}</h3>
              </div>
              <a
                href={ficha.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'mt-4 w-full',
                  buttonVariants({ variant: 'default' })
                )}
              >
                <FileText className="h-4 w-4 mr-2" />
                Abrir PDF
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">No se encontraron fichas técnicas que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  );
}
