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
  },
  {
    title: 'Seguimientos',
    icon: <ClipboardList />,
    href: '/seguimientos',
  },
  {
    title: 'Recordatorios',
    icon: <Bell />,
    href: '#',
  },
  {
    title: 'Pedidos',
    icon: <Package />,
    href: '/pedidos',
  },
  {
    title: 'Productos',
    icon: <ShoppingBag />,
    href: '/productos',
  },
  {
    title: 'Mapa de Clientes',
    icon: <Map />,
    href: '/mapa-clientes',
  },
  {
    title: 'Calculadora de Productos (IA)',
    icon: <Calculator />,
    href: '/calculadora',
  },
  {
    title: 'Soporte IA',
    icon: <Bot />,
    href: '/soporte',
  },
  {
    title: 'Guía de Aceites',
    icon: <Droplets />,
    href: '/guia-aceites',
  },
  {
    title: 'Guía de Aditivos',
    icon: <TestTube />,
    href: '/guia-aditivos',
  },
];

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
            {menuItems.map((item) => (
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
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Bienvenido</h1>
            <p className="mt-2 text-muted-foreground">
              Usa el menú lateral para navegar al Panel de Control.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
