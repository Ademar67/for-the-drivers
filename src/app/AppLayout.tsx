"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";
import ConnectionStatus from "@/components/ConnectionStatus";
import FirestoreSyncStatus from "@/components/FirestoreSyncStatus";
import LogoutButton from "@/components/auth/LogoutButton";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { useAuth } from "@/context/AuthProvider";

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
  FileSearch2,
  Calculator,
  Truck,
  Boxes,
  Building2,
  Lightbulb,
  Menu,
  Car,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const mobileBottomItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/prospectos", label: "Prospectos", icon: UserPlus },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/cotizaciones", label: "Más", icon: Menu },
];

const menuItems = [
  {
    section: "🏠 INICIO",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Home }],
  },

  {
    section: "💼 COMERCIAL",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/prospectos", label: "Prospectos", icon: UserPlus },
      { href: "/agencias", label: "Agencias PRO", icon: Building2 },
      { href: "/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
      { href: "/facturas", label: "Cobranza", icon: FileText },
      { href: "/precios", label: "Precios", icon: Calculator },
    ],
  },

  {
    section: "📅 OPERACIÓN",
    items: [
      { href: "/agenda", label: "Agenda", icon: Calendar },
      { href: "/inventario", label: "Inventario", icon: Boxes },
      { href: "/mapa-clientes", label: "Mapa de Clientes", icon: MapPin },
      { href: "/mapa-visitas", label: "Mapa de Visitas", icon: Map },
    ],
  },

  {
    section: "🔵 LIQUI MOLY PRO",
    items: [
      { href: "/aplicaciones", label: "Aplicaciones LM PRO", icon: Car },
      { href: "/productos", label: "Productos", icon: Package },
      { href: "/materiales", label: "Materiales", icon: FileText },
      { href: "/fichas-tecnicas", label: "Fichas Técnicas", icon: FileSearch2 },
      { href: "/guias-liqui-moly", label: "Guías Liqui Moly", icon: BookOpen },
    ],
  },

  {
    section: "🤖 IA",
    items: [
      { href: "/soporte-ia", label: "Soporte IA", icon: Bot },
      { href: "/ia-tecnica", label: "IA Técnica", icon: Car },
      { href: "/ideas-venta", label: "Ideas de Venta", icon: Lightbulb },
    ],
  },

  {
    section: "🚚 ESPECIALIZADOS",
    items: [{ href: "/flotillas", label: "Flotillas", icon: Truck }],
  },
];
const PUBLIC_ROUTES = ["/login", "/sign-up"];

function getPageTitle(pathname: string) {
  for (const section of menuItems) {
    const item = section.items.find((i) =>
      pathname.startsWith(i.href)
    );

    if (item) return item.label;
  }

  return "Liqui Moly Sales Hub";
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [showSplash, setShowSplash] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    "🏠 INICIO": true,
    "💼 COMERCIAL": true,
    "📅 OPERACIÓN": true,
    "🔵 LIQUI MOLY PRO": true,
    "🤖 IA": true,
    "🚚 ESPECIALIZADOS": true,
  });

  const isAuthPage = PUBLIC_ROUTES.includes(pathname);
  const currentTitle = getPageTitle(pathname);

  useEffect(() => {
    const seen = localStorage.getItem("splashSeen");

    if (!seen) {
      setShowSplash(true);
      localStorage.setItem("splashSeen", "1");
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (user && isAuthPage) {
      router.replace("/dashboard");
    }
  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return (
      <FirebaseClientProvider>
        <ToastProvider>
          <ConnectionStatus />
          <FirestoreSyncStatus />

          <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <p className="text-sm text-muted-foreground">
              Cargando...
            </p>
          </div>
        </ToastProvider>
      </FirebaseClientProvider>
    );
  }

  if (!user && !isAuthPage) {
    return (
      <FirebaseClientProvider>
        <ToastProvider>
          <ConnectionStatus />
          <FirestoreSyncStatus />

          <div className="min-h-screen bg-background" />
        </ToastProvider>
      </FirebaseClientProvider>
    );
  }

  if (isAuthPage) {
    return (
      <FirebaseClientProvider>
        <ToastProvider>
          <ConnectionStatus />
          <FirestoreSyncStatus />

          {showSplash && (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          )}

          <main className="min-h-screen bg-background">
            {children}
          </main>
        </ToastProvider>
      </FirebaseClientProvider>
    );
  }

  return (
    <FirebaseClientProvider>
      <ToastProvider>
        <ConnectionStatus />
        <FirestoreSyncStatus />

        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        <div className="flex min-h-screen w-full bg-background">
          {sidebarOpen && (
            <button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 md:static md:z-auto md:w-64 md:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4 md:justify-start">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent/20">
                  <Image
                    src="/liquimoly-logo-v4.png"
                    alt="Liqui Moly"
                    width={44}
                    height={44}
                    className="h-10 w-10 object-contain"
                    priority
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold">Liqui Moly</p>

                  <p className="text-xs text-sidebar-foreground/70">
                    Sales Hub
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-2 hover:bg-sidebar-accent/80 md:hidden"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col overflow-y-auto p-3">
              {menuItems.map((section) => (
                <div key={section.section} className="mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [section.section]:
                          !prev[section.section as keyof typeof prev],
                      }))
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  >
                    <span>{section.section}</span>

                    {openSections[
                      section.section as keyof typeof openSections
                    ] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>

                  {openSections[
                    section.section as keyof typeof openSections
                  ] && (
                    <>
                      {section.items.map((item) => {
                        const Icon = item.icon;

                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                              isActive
                                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent/80"
                            }`}
                          >
                            <Icon size={18} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </nav>

            <div className="p-4">
              <LogoutButton />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md border p-2"
              >
                <Menu size={20} />
              </button>

              <h1 className="truncate text-lg font-semibold">{currentTitle}</h1>
            </header>

            <main className="min-w-0 flex-1 overflow-auto pb-24 md:pb-0">
              <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
                {children}
              </div>
            </main>

            {/* Bottom Navigation Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
              <div className="grid grid-cols-5">
                {mobileBottomItems.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex flex-col items-center justify-center gap-1 py-3 text-xs transition ${
                        isActive
                          ? "text-blue-600 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      <Icon size={20} />

                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </ToastProvider>
    </FirebaseClientProvider>
  );
}
