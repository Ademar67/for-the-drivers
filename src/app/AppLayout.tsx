
"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";
import Link from "next/link";
import ConnectionStatus from "@/components/ConnectionStatus";

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
          <Link href="/materiales" onClick={handleLinkClick}>
            <FileSearch />
            <span>Materiales</span>
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(false);
  
    useEffect(() => {
      const seen = localStorage.getItem("splashSeen");
      if (!seen) setShowSplash(true);
    }, []);
  

    return (
        <SidebarProvider>
            <ConnectionStatus />
            <div className="flex min-h-screen w-full">
            <Sidebar>
                <SidebarHeader>
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

                <SidebarFooter>
                    {/* Logout button removed */}
                </SidebarFooter>
            </Sidebar>

            <main className="flex-1 p-6">
                {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
                <SidebarTrigger />
                <FirebaseClientProvider>
                    {children}
                </FirebaseClientProvider>
            </main>
            </div>
        </SidebarProvider>
    );
  }
