'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  MessageCircle,
  Copy,
  Filter,
  TrendingUp,
} from 'lucide-react';

type CategoriaIdea =
  | 'taller'
  | 'refaccionaria'
  | 'flotilla'
  | 'agencia'
  | 'cierres';

type PrioridadIdea = 'alta' | 'media' | 'baja';

type IdeaVenta = {
  id: string;
  titulo: string;
  categoria: CategoriaIdea;
  descripcion: string;
  guion: string;
  prioridad: PrioridadIdea;
};

const ideasMock: IdeaVenta[] = [
  {
    id: '1',
    titulo: 'Ahorro en flotillas',
    categoria: 'flotilla',
    descripcion: 'Reducir desgaste, consumo y mantenimiento correctivo.',
    guion:
      'No te vendo producto, te ayudo a bajar costos por desgaste y consumo de combustible. Probamos con unas unidades y medimos resultados.',
    prioridad: 'alta',
  },
  {
    id: '2',
    titulo: 'Servicio premium para taller',
    categoria: 'taller',
    descripcion: 'Sube ticket promedio sin meter más mano de obra.',
    guion:
      'Este servicio te ayuda a dar un valor extra y aumentar tu ticket sin meter más mano de obra.',
    prioridad: 'alta',
  },
  {
    id: '3',
    titulo: 'Objeción de precio',
    categoria: 'cierres',
    descripcion: 'Respuesta cuando te dicen “está caro”.',
    guion:
      'Más que caro o barato, es rendimiento. Si te dura más y protege mejor, al final te sale más barato.',
    prioridad: 'alta',
  },
  {
    id: '4',
    titulo: 'Rotación en refaccionaria',
    categoria: 'refaccionaria',
    descripcion: 'Enfoque para mover producto y evitar inventario parado.',
    guion:
      'Esto no es un producto para que se quede arrumbado. Es un producto que rota cuando el cliente nota el resultado y vuelve a pedirlo.',
    prioridad: 'media',
  },
  {
    id: '5',
    titulo: 'Valor agregado en agencia',
    categoria: 'agencia',
    descripcion: 'Usa paquetes para subir ticket por servicio.',
    guion:
      'Esto lo puedes vender como adicional en servicio y aumentar tu ticket por unidad sin complicar la operación.',
    prioridad: 'media',
  },
];

const filtros: Array<'todas' | CategoriaIdea> = [
  'todas',
  'taller',
  'refaccionaria',
  'flotilla',
  'agencia',
  'cierres',
];

function getPrioridadClasses(prioridad: PrioridadIdea) {
  switch (prioridad) {
    case 'alta':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'media':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'baja':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getCategoriaLabel(categoria: CategoriaIdea) {
  switch (categoria) {
    case 'taller':
      return 'Taller';
    case 'refaccionaria':
      return 'Refaccionaria';
    case 'flotilla':
      return 'Flotilla';
    case 'agencia':
      return 'Agencia';
    case 'cierres':
      return 'Cierres';
    default:
      return categoria;
  }
}

export default function IdeasVentaPage() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<'todas' | CategoriaIdea>('todas');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const ideasFiltradas = useMemo(() => {
    if (filtro === 'todas') return ideasMock;
    return ideasMock.filter((idea) => idea.categoria === filtro);
  }, [filtro]);

  const copiar = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(id);

      setTimeout(() => {
        setCopiadoId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch (error) {
      console.error('No se pudo copiar el guión:', error);
    }
  };

  const abrirWhatsApp = (texto: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lightbulb size={22} />
            </div>

            <div>
                    <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <h1 className="text-2xl font-bold tracking-tight">
                Ideas de Venta PRO
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Guiones rápidos para visitas, seguimiento y cierre de clientes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
            <TrendingUp size={16} />
            <span>{ideasFiltradas.length} idea(s) mostrada(s)</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <p className="text-sm font-medium">Filtrar por categoría</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={filtro === cat ? 'default' : 'outline'}
              onClick={() => setFiltro(cat)}
              className="capitalize whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </section>

      <section>
        {ideasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No hay ideas para este filtro.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ideasFiltradas.map((idea) => (
              <article
                key={idea.id}
                className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">
                      {idea.titulo}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {idea.descripcion}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPrioridadClasses(
                      idea.prioridad
                    )}`}
                  >
                    {idea.prioridad}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {getCategoriaLabel(idea.categoria)}
                  </span>
                </div>

                <div className="mb-4 flex-1 rounded-xl bg-muted/60 p-4">
                  <p className="text-sm leading-6 text-foreground">{idea.guion}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => copiar(idea.id, idea.guion)}
                    className="flex-1"
                  >
                    <Copy size={16} className="mr-2" />
                    {copiadoId === idea.id ? 'Copiado' : 'Copiar guión'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => abrirWhatsApp(idea.guion)}
                    className="flex-1"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}