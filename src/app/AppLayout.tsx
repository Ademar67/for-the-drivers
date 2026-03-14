"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";
import ConnectionStatus from "@/components/ConnectionStatus";
import FirestoreSyncStatus from "@/components/FirestoreSyncStatus";
import LogoutButton from "@/components/auth/LogoutButton";

import {
  Sidebar,
  SidebarContent,
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
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/prospectos", label: "Prospectos", icon: UserPlus },
    { href: "/agenda", label: "Agenda", icon: Calendar },
    { href: "/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
    { href: "/mapa-visitas", label: "Mapa de Visitas", icon: Map },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/facturas", label: "Cobranza", icon: FileText },
    { href: "/mapa-clientes", label: "Mapa de Clientes", icon: MapPin },
    { href: "/guias-liqui-moly", label: "Guías Liqui Moly", icon: BookOpen },
    { href: "/fichas-tecnicas", label: "Fichas Técnicas", icon: FileSearch },
    { href: "/materiales", label: "Materiales", icon: FileText },
    { href: "/soporte-ia", label: "Soporte IA", icon: Bot },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild size="lg" isActive={isActive}>
              <Link href={item.href} onClick={handleLinkClick}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("splashSeen");
    if (!seen) {
      setShowSplash(true);
      localStorage.setItem("splashSeen", "1");
    }
  }, []);

  return (
    <SidebarProvider>
      <ConnectionStatus />
      <FirestoreSyncStatus />

      <div className="flex min-h-screen w-full bg-background pt-10">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                <Image
                  src="/liquimoly-logo-v4.png"
                  alt="Liqui Moly"
                  width={44}
                  height={44}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  Liqui Moly
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">
                  Sales Hub
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            <SidebarGroup>
              <SidebarGroupLabel>Menú</SidebarGroupLabel>
              <SidebarNavigation />
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto border-t border-sidebar-border/60 p-4">
            <LogoutButton />
          </div>
        </Sidebar>

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-4 flex items-center">
            <SidebarTrigger />
          </div>

          {showSplash && (
            <SplashScreen
              onFinish={() => {
                setShowSplash(false);
              }}
            />
          )}

          <FirebaseClientProvider>{children}</FirebaseClientProvider>
        </main>
      </div>
    </SidebarProvider>
  );
}