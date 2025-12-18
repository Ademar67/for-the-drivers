import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Book,
  Bot,
  Calculator,
  Home,
  Users,
  Package,
  FileText,
  Map,
} from "lucide-react";
import Image from "next/image";

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
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icon-192x192.png"
                      alt="Liqui Moly"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-sm"
                    />
                  </div>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/dashboard" tooltip="Dashboard">
                        <Home />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/clientes" tooltip="Clientes">
                        <Users />
                        <span>Clientes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/pedidos" tooltip="Pedidos">
                        <Package />
                        <span>Pedidos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/productos" tooltip="Productos">
                        <Package />
                        <span>Productos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/facturas" tooltip="Facturas">
                        <FileText />
                        <span>Facturas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/mapa" tooltip="Mapa">
                        <Map />
                        <span>Mapa de Clientes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/guias" tooltip="Guías">
                        <Book />
                        <span>Guías Liqui Moly</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/ia-soporte" tooltip="IA Soporte">
                        <Bot />
                        <span>IA Soporte</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        href="/calculadora"
                        tooltip="Calculadora"
                      >
                        <Calculator />
                        <span>Calculadora</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <header className="flex h-12 items-center gap-2 border-b bg-background px-4">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="flex-1 text-lg font-semibold">
                    Liqui Moly Sales Hub
                  </h1>
                </header>
                {children}
              </SidebarInset>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
