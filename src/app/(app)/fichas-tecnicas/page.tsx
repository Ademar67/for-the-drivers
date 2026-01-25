
'use client';

import { useState, useMemo } from 'react';
import { fichasTecnicas, FichaTecnica } from '@/lib/fichas-tecnicas';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';

const CATEGORIES = ['Todas', 'Aceite', 'Mantenimiento', 'Tratamientos'] as const;
type Category = (typeof CATEGORIES)[number];

const categoryBadgeClass: Record<FichaTecnica['category'], string> = {
  Aceite: 'bg-blue-100 text-blue-800 border-blue-200',
  Mantenimiento: 'bg-green-100 text-green-800 border-green-200',
  Tratamientos: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function FichasTecnicasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todas');

  const filteredFichas = useMemo(() => {
    return fichasTecnicas.filter(ficha => {
      const matchesCategory =
        activeCategory === 'Todas' || ficha.category === activeCategory;
      const matchesSearch = ficha.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, activeCategory]);

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
      {filteredFichas.length > 0 ? (
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
