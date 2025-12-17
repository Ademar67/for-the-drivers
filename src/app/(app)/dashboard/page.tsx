
"use client";

import Link from "next/link";
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
  LayoutDashboard,
  Bell,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { FeatureCard } from "@/components/feature-card";

export default function DashboardPage() {

  // ---------------------------
  // FEATURES
  // ---------------------------
  const features = [
    {
      title: "Clientes",
      icon: <Users />,
      href: "/clientes",
      description: "Gestiona la información de tus clientes.",
    },
    {
      title: "Seguimientos",
      icon: <ClipboardList />,
      href: "/seguimientos",
      description: "Realiza seguimientos de ventas y visitas a clientes.",
    },
    {
      title: "Recordatorios",
      icon: <Bell />,
      href: "#",
      description: "Configura recordatorios para no perder ninguna oportunidad.",
    },
    {
      title: "Pedidos",
      icon: <Package />,
      href: "/pedidos",
      description: "Administra los pedidos de productos de tus clientes.",
    },
    {
      title: "Facturas",
      icon: <Receipt />,
      href: "/facturas",
      description: "Gestiona el cobro de facturas a tus clientes.",
    },
    {
      title: "Productos",
      icon: <ShoppingBag />,
      href: "/productos",
      description: "Consulta el catálogo de productos Liqui Moly.",
    },
    {
      title: "Mapa de Clientes",
      icon: <Map />,
      href: "/mapa-clientes",
      description: "Visualiza la ubicación de tus clientes en un mapa.",
    },
    {
      title: "Calculadora IA",
      icon: <Calculator />,
      href: "/calculadora",
      description: "Obtén recomendaciones de productos con IA.",
    },
    {
      title: "Soporte IA",
      icon: <Bot />,
      href: "/soporte",
      description: "Asistencia virtual con inteligencia artificial.",
    },
    {
      title: "Guía de Aceites",
      icon: <Droplets />,
      href: "/guia-aceites",
      description: "Información completa sobre aceites y lubricantes.",
    },
    {
      title: "Guía de Aditivos",
      icon: <TestTube />,
      href: "/guia-aditivos",
      description: "Todo sobre aditivos y sus aplicaciones.",
    },
  ];

  // ---------------------------
  // SIDEBAR MENU
  // ---------------------------
  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard />,
      href: "/dashboard",
    },
    {
      title: "Clientes",
      icon: <Users />,
      href: "/clientes",
    },
    {
      title: "Seguimientos",
      icon: <ClipboardList />,
      href: "/seguimientos",
    },
    {
      title: "Pedidos",
      icon: <Package />,
      href: "/pedidos",
    },
    {
      title: "Facturas",
      icon: <Receipt />,
      href: "/facturas",
    },
    {
      title: "Productos",
      icon: <ShoppingBag />,
      href: "/productos",
    },
  ];

  // ---------------------------
  // RETURN UI
  // ---------------------------
  return (
    <>
      {/* SIDEBAR */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <img
              src="/icon-192x192.png"
              alt="Liqui Moly"
              className="h-10 w-10 rounded-sm"
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === "/dashboard"}
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

      {/* CONTENIDO */}
      <SidebarInset>
        <div className="p-8">
          <h1 className="text-4xl font-bold font-headline mb-2">
            Panel de Control
          </h1>

          <p className="text-muted-foreground mb-8">
            Tu centro de operaciones para gestionar tus ventas. Desde aquí podrás activar y configurar cada módulo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
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
    </>
  );
}
