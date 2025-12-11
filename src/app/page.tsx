
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
  LayoutDashboard,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/feature-card';

const menuItems = [
  {
    title: 'Panel de Control',
    icon: <LayoutDashboard />,
    href: '/',
  },
  {
    title: 'Clientes',
    icon: <Users />,
    href: '/clientes',
    description: 'Gestiona la información de tus clientes y sus vehículos.',
  },
  {
    title: 'Seguimientos',
    icon: <ClipboardList />,
    href: '/seguimientos',
    description: 'Realiza seguimientos de ventas y visitas a clientes.',
  },
  {
    title: 'Recordatorios',
    icon: <Bell />,
    href: '#',
    description: 'Configura recordatorios para no perder ninguna oportunidad.',
  },
  {
    title: 'Pedidos',
    icon: <Package />,
    href: '/pedidos',
    description: 'Administra los pedidos de productos de tus clientes.',
  },
  {
    title: 'Productos',
    icon: <ShoppingBag />,
    href: '/productos',
    description: 'Consulta el catálogo completo de productos Liqui Moly.',
  },
  {
    title: 'Mapa de Clientes',
    icon: <Map />,
    href: '/mapa-clientes',
    description: 'Visualiza la ubicación de tus clientes en un mapa.',
  },
];

const aiFeatures = [
    {
    title: 'Calculadora de Productos (IA)',
    icon: <Calculator />,
    href: '/calculadora',
    description: 'Obtén recomendaciones de productos basadas en IA.',
  },
  {
    title: 'Soporte IA',
    icon: <Bot />,
    href: '/soporte',
    description: 'Resuelve tus dudas con nuestro asistente virtual inteligente.',
  },
]

const guides = [
    {
    title: 'Guía de Aceites',
    icon: <Droplets />,
    href: '/guia-aceites',
    description: 'Encuentra información detallada sobre la gama de aceites.',
  },
  {
    title: 'Guía de Aditivos',
    icon: <TestTube />,
    href: '/guia-aditivos',
    description: 'Descubre todo sobre los aditivos y sus aplicaciones.',
  },
]

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Liqui Moly</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {[...menuItems, ...aiFeatures, ...guides].map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === '/'}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-8">
            <h1 className="text-4xl font-bold font-headline mb-2">
              Panel de Control
            </h1>
            <p className="text-muted-foreground mb-8">
              Tu centro de operaciones para gestionar ventas y clientes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.filter(item => item.href !== '/').map((feature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description!}
                  icon={feature.icon}
                  href={feature.href}
                />
              ))}
            </div>

             <h2 className="text-3xl font-bold font-headline mt-12 mb-6">Herramientas con IA</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {aiFeatures.map((feature) => (
                    <FeatureCard
                    key={feature.title}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    href={feature.href}
                    />
                ))}
            </div>

            <h2 className="text-3xl font-bold font-headline mt-12 mb-6">Guías de Productos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {guides.map((feature) => (
                    <FeatureCard
                    key={feature.title}
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    href={feature.href}
                    />
                ))}
            </div>
          </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
