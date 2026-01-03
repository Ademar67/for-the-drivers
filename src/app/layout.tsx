
import "./globals.css";
import Image from "next/image";
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
} from "@/components/ui/sidebar";

import {
  Home,
  Users,
  Calendar,
  Package,
  FileText,
  MapPin,
  BookOpen,
  Calculator,
  Bot,
  Map,
  UserPlus,
} from "lucide-react";

import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata = {
  title: "Liqui Moly Sales Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <Sidebar>
                <SidebarHeader>
                  <img
                    src="/icon-192x192.png"
                    alt="Liqui Moly"
                    className="h-10 w-10 rounded-sm"
                  />
                </SidebarHeader>

                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Menú</SidebarGroupLabel>

                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/dashboard">
                            <Home />
                            <span>Dashboard</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/clientes">
                            <Users />
                            <span>Clientes</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                       <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/prospectos">
                            <UserPlus />
                            <span>Prospectos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/agenda">
                            <Calendar />
                            <span>Agenda</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/mapa-visitas">
                            <Map />
                            <span>Mapa de Visitas</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/productos">
                            <Package />
                            <span>Productos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/facturas">
                            <FileText />
                            <span>Facturas</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/mapa-clientes">
                            <MapPin />
                            <span>Mapa de Clientes</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/guias-liqui-moly">
                            <BookOpen />
                            <span>Guías Liqui Moly</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/calculadora">
                            <Calculator />
                            <span>Calculadora</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/soporte-ia">
                            <Bot />
                            <span>Soporte IA</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
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
