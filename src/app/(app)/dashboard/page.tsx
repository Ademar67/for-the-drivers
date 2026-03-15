"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  FileText,
  Calendar,
  Calculator,
  Bot,
  MapPin,
  UserPlus,
  ClipboardList,
  BookOpen,
  Target,
  PhoneCall,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { db } from "@/firebase/config";

const dashboardCards = [
  {
    title: "Clientes",
    description: "Gestión de clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Prospectos",
    description: "Seguimiento de oportunidades",
    href: "/prospectos",
    icon: UserPlus,
  },
  {
    title: "Agenda de Visitas",
    description: "Tareas, visitas y cotizaciones",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Cotizaciones",
    description: "Crear y gestionar cotizaciones",
    href: "/cotizaciones",
    icon: ClipboardList,
  },
  {
    title: "Precios",
    description: "Calculadora de precios y descuentos",
    href: "/precios",
    icon: Calculator,
  },
  {
    title: "Mapa de Clientes",
    description: "Visualiza y gestiona tus clientes y prospectos",
    href: "/mapa-clientes",
    icon: MapPin,
  },
  {
    title: "Productos",
    description: "Catálogo de productos",
    href: "/productos",
    icon: Package,
  },
  {
    title: "Cobranza",
    description: "Gestiona tus facturas y cobros",
    href: "/facturas",
    icon: FileText,
  },
  {
    title: "Guías Liqui Moly",
    description: "Guías de aceites y tratamientos",
    href: "/guias-liqui-moly",
    icon: BookOpen,
  },
  {
    title: "Fichas Técnicas",
    description: "Consulta fichas técnicas Liqui Moly",
    href: "/fichas-tecnicas",
    icon: Calculator,
  },
  {
    title: "Materiales",
    description: "Listas de precios, catálogos y promos",
    href: "/materiales",
    icon: FileText,
  },
  {
    title: "Asesor Digital",
    description:
      "Recomendaciones personalizadas según el problema del vehículo",
    href: "/soporte-ia",
    icon: Bot,
  },
];

type DashboardStats = {
  clientes: number;
  prospectos: number;
  seguimientos: number;
  visitasHoy: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    clientes: 0,
    prospectos: 0,
    seguimientos: 0,
    visitasHoy: 0,
  });

  const [loading, setLoading] = useState(true);
  const [quickPriceSearch, setQuickPriceSearch] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const clientesRef = collection(db, "clientes");
        const visitasRef = collection(db, "visitas");

        const clientesSnap = await getDocs(clientesRef);

        const prospectosQuery = query(
          clientesRef,
          where("tipo", "==", "prospecto")
        );
        const prospectosSnap = await getDocs(prospectosQuery);

        const seguimientoQuery = query(
          clientesRef,
          where("estadoProspecto", "==", "seguimiento")
        );
        const seguimientoSnap = await getDocs(seguimientoQuery);

        const visitasSnap = await getDocs(visitasRef);

        const today = new Date().toISOString().split("T")[0];

        const visitasHoy = visitasSnap.docs.filter((doc) => {
          const data = doc.data();
          const fecha = data.fecha;

          if (!fecha) return false;

          if (typeof fecha === "string") {
            return fecha.startsWith(today);
          }

          return false;
        }).length;

        setStats({
          clientes: clientesSnap.size,
          prospectos: prospectosSnap.size,
          seguimientos: seguimientoSnap.size,
          visitasHoy,
        });
      } catch (error) {
        console.error("Error cargando métricas del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleQuickPriceSearch = () => {
    const term = quickPriceSearch.trim();

    if (!term) {
      router.push("/precios");
      return;
    }

    router.push(`/precios?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="min-h-screen space-y-10 bg-gradient-to-b from-background via-background to-muted/30 p-1">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>

        <p className="text-muted-foreground">
          Accede rápidamente a todas las herramientas de gestión comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clientes activos
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? "..." : stats.clientes}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                Base total de clientes registrados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Prospectos
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Target className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? "..." : stats.prospectos}
              </p>
              <p className="text-sm text-muted-foreground">
                Oportunidades actualmente en seguimiento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Seguimientos
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <PhoneCall className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? "..." : stats.seguimientos}
              </p>
              <p className="text-sm text-muted-foreground">
                Prospectos marcados en etapa de seguimiento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Visitas hoy
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {loading ? "..." : stats.visitasHoy}
              </p>
              <p className="text-sm text-muted-foreground">
                Actividades programadas para hoy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Acciones rápidas</h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/clientes" className="block">
            <Card className="cursor-pointer border border-border bg-card/90 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-sm font-medium">
                <Users className="h-5 w-5 text-blue-600" />
                Nuevo cliente
              </CardContent>
            </Card>
          </Link>

          <Link href="/cotizaciones" className="block">
            <Card className="cursor-pointer border border-border bg-card/90 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-sm font-medium">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                Nueva cotización
              </CardContent>
            </Card>
          </Link>

          <Link href="/agenda" className="block">
            <Card className="cursor-pointer border border-border bg-card/90 transition-all duration-200 hover:border-violet-200 hover:bg-violet-50 hover:shadow-md">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-sm font-medium">
                <Calendar className="h-5 w-5 text-violet-600" />
                Agendar visita
              </CardContent>
            </Card>
          </Link>

          <Link href="/precios" className="block">
            <Card className="cursor-pointer border border-border bg-card/90 transition-all duration-200 hover:border-amber-200 hover:bg-amber-50 hover:shadow-md">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-sm font-medium">
                <Calculator className="h-5 w-5 text-amber-600" />
                Consultar precio
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
            Búsqueda rápida de precios
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={quickPriceSearch}
                onChange={(e) => setQuickPriceSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleQuickPriceSearch();
                  }
                }}
                placeholder="Ej. Molygen 5W-30, aditivo, limpiador..."
                className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={handleQuickPriceSearch}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Buscar precio
            </button>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Escribe el nombre del producto y te mando directo a la sección de
            precios.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <Card className="h-full border border-border/80 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition duration-200 group-hover:scale-105 group-hover:bg-primary/15">
                    <card.icon className="h-6 w-6" />
                  </div>

                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
