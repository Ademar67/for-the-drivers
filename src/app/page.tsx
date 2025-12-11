import { FeatureCard } from '@/components/feature-card';
import {
  Users,
  ClipboardList,
  Package,
  Receipt,
  ShoppingBag,
  Map,
  Calculator,
  Bot,
  Droplets,
  TestTube,
  Wrench,
} from 'lucide-react';

const features = [
  {
    title: 'Clientes',
    description: 'Gestionar información de clientes.',
    icon: <Users className="w-8 h-8" />,
    href: '/clientes',
  },
  {
    title: 'Seguimientos',
    description: 'Realizar seguimientos de clientes y prospectos.',
    icon: <ClipboardList className="w-8 h-8" />,
    href: '/seguimientos',
  },
  {
    title: 'Pedidos',
    description: 'Gestionar pedidos de clientes.',
    icon: <Package className="w-8 h-8" />,
    href: '/pedidos',
  },
  {
    title: 'Facturas',
    description: 'Cobro de facturas.',
    icon: <Receipt className="w-8 h-8" />,
    href: '/facturas',
  },
  {
    title: 'Productos',
    description: 'Administrar el catálogo de productos.',
    icon: <ShoppingBag className="w-8 h-8" />,
    href: '/productos',
  },
  {
    title: 'Mapa de Clientes',
    description: 'Visualizar la ubicación de los clientes.',
    icon: <Map className="w-8 h-8" />,
    href: '/mapa-clientes',
  },
  {
    title: 'Calculadora de Productos',
    description: 'Recomendaciones de productos con IA.',
    icon: <Calculator className="w-8 h-8" />,
    href: '/calculadora',
  },
  {
    title: 'Soporte IA',
    description: 'Asistente virtual para resolver dudas.',
    icon: <Bot className="w-8 h-8" />,
    href: '/soporte',
  },
  {
    title: 'Guía de Aceites',
    description: 'Información detallada sobre aceites.',
    icon: <Droplets className="w-8 h-8" />,
    href: '/guia-aceites',
  },
  {
    title: 'Guía de Aditivos',
    description: 'Información detallada sobre aditivos.',
    icon: <TestTube className="w-8 h-8" />,
    href: '/guia-aditivos',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Wrench className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold">Liqui Moly Sales Hub</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl font-headline">
              Bienvenido a su Centro de Ventas
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Seleccione una herramienta para comenzar.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                href={feature.href}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        </div>
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-background border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-center text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Liqui Moly Sales Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
