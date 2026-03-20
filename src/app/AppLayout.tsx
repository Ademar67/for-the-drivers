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
import { FirebaseClientProvider } from "@/firebase/client-provider";

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
  Calculator,
  Truck,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/prospectos", label: "Prospectos", icon: UserPlus },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
  { href: "/precios", label: "Precios", icon: Calculator },
  { href: "/mapa-visitas", label: "Mapa de Visitas", icon: Map },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/facturas", label: "Cobranza", icon: FileText },
  { href: "/mapa-clientes", label: "Mapa de Clientes", icon: MapPin },
  { href: "/guias-liqui-moly", label: "Guías Liqui Moly", icon: BookOpen },
  { href: "/fichas-tecnicas", label: "Fichas Técnicas", icon: FileSearch },
  { href: "/materiales", label: "Materiales", icon: FileText },
  { href: "/soporte-ia", label: "Soporte IA", icon: Bot },
  { href: "/flotillas", label: "Flotillas", icon: Truck },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("splashSeen");
    if (!seen) {
      setShowSplash(true);
      localStorage.setItem("splashSeen", "1");
    }
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/sign-up";

  if (isAuthPage) {
    return (
      <FirebaseClientProvider>
        <ConnectionStatus />
        <FirestoreSyncStatus />
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <main className="min-h-screen bg-background">{children}</main>
      </FirebaseClientProvider>
    );
  }

  return (
    <FirebaseClientProvider>
      <ConnectionStatus />
      <FirestoreSyncStatus />

      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="flex min-h-screen w-full bg-background">
        <aside className="flex w-64 flex-col border-r bg-[#0f3b82] text-white">
          <div className="border-b px-4 py-4">
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

              <div>
                <p className="text-sm font-semibold">Liqui Moly</p>
                <p className="text-xs text-white/70">Sales Hub</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-white/20 font-semibold"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4">
            <LogoutButton />
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </FirebaseClientProvider>
  );
}