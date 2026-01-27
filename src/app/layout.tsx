"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Home,
  Users,
  Calendar,
  Package,
  FileText,
  MapPin,
  BookOpen,
  Bot,
  Map,
  UserPlus,
  ClipboardList,
  FileSearch,
} from "lucide-react";

import { FirebaseClientProvider } from "@/firebase/client-provider";

function SidebarNavigation() {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard" onClick={handleLinkClick}>
            <Home />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/clientes" onClick={handleLinkClick}>
            <Users />
            <span>Clientes</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/prospectos" onClick={handleLinkClick}>
            <UserPlus />
            <span>Prospectos</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/agenda" onClick={handleLinkClick}>
            <Calendar />
            <span>Agenda</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/cotizaciones" onClick={handleLinkClick}>
            <ClipboardList />
            <span>Cotizaciones</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/mapa-visitas" onClick={handleLinkClick}>
            <Map />
            <span>Mapa de Visitas</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/productos" onClick={handleLinkClick}>
            <Package />
            <span>Productos</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/facturas" onClick={handleLinkClick}>
            <FileText />
            <span>Cobranza</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/mapa-clientes" onClick={handleLinkClick}>
            <MapPin />
            <span>Mapa de Clientes</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/guias-liqui-moly" onClick={handleLinkClick}>
            <BookOpen />
            <span>Guías Liqui Moly</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/fichas-tecnicas" onClick={handleLinkClick}>
            <FileSearch />
            <span>Fichas Técnicas</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/soporte-ia" onClick={handleLinkClick}>
            <Bot />
            <span>Soporte IA</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("splashSeen");
    if (!seen) setShowSplash(true);
  }, []);

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003A8F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Liqui Moly" />
        {/* ✅ usa un archivo que sí existe */}
        <link rel="apple-touch-icon" href="/logo-liqui-moly.png" />
      </head>

      <body>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <Sidebar>
                <SidebarHeader>
                  {/* ✅ usa un archivo que sí existe */}
                  <img
                    src="/logo-liqui-moly.png"
                    alt="Liqui Moly"
                    className="h-10 w-10 rounded-sm"
                  />
                </SidebarHeader>

                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Menú</SidebarGroupLabel>
                    <SidebarNavigation />
                  </SidebarGroup>
                </SidebarContent>

                <SidebarFooter />
              </Sidebar>

              <main className="flex-1 p-6">
                <SidebarTrigger />
                {children}
              </main>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}