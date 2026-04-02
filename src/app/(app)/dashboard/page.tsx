"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Boxes,
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  FileText,
  MapPin,
  Package,
  PhoneCall,
  Search,
  Target,
  UserPlus,
  Users,
  Sparkles,
  BarChart3,
  FolderKanban,
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

const dashboardCards = [
  {
    title: "Clientes",
    description: "Gestión completa de clientes y cartera activa.",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Prospectos",
    description: "Seguimiento comercial y oportunidades por convertir.",
    href: "/prospectos",
    icon: UserPlus,
  },
  {
    title: "Agencias",
    description: "Control y seguimiento de agencias registradas.",
    href: "/agencias",
    icon: Building2,
  },
  {
    title: "Agenda de Visitas",
    description: "Planeación de visitas, tareas y seguimiento diario.",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Cotizaciones",
    description: "Creación, revisión y control de cotizaciones.",
    href: "/cotizaciones",
    icon: ClipboardList,
  },
  {
    title: "Precios",
    description: "Consulta rápida de precios y descuentos.",
    href: "/precios",
    icon: Calculator,
  },
  {
    title: "Inventario",
    description: "Captura y consulta de inventario por tienda.",
    href: "/inventario",
    icon: Boxes,
  },
  {
    title: "Mapa de Clientes",
    description: "Visualiza clientes y prospectos por ubicación.",
    href: "/mapa-clientes",
    icon: MapPin,
  },
  {
    title: "Productos",
    description: "Catálogo general de productos disponibles.",
    href: "/productos",
    icon: Package,
  },
  {
    title: "Cobranza",
    description: "Seguimiento de facturas y cobros pendientes.",
    href: "/facturas",
    icon: FileText,
  },
  {
    title: "Guías Liqui Moly",
    description: "Consulta técnica para ventas y aplicación.",
    href: "/guias-liqui-moly",
    icon: BookOpen,
  },
  {
    title: "Fichas Técnicas",
    description: "Información técnica y soporte de producto.",
    href: "/fichas-tecnicas",
    icon: FolderKanban,
  },
  {
    title: "Materiales",
    description: "Promos, listas de precio y material comercial.",
    href: "/materiales",
    icon: FileText,
  },
  {
    title: "Asesor Digital",
    description: "Recomendaciones inteligentes según necesidad del cliente.",
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "..." : value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
        <ArrowUpRight className="h-4 w-4 text-green-500" />
        {subtitle}
      </p>
    </div>
  );
}

function QuickActionCard({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-slate-50 p-4 transition hover:bg-slate-100 hover:shadow-sm"
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <Icon className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

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
          if (typeof fecha === "string") return fecha.startsWith(today);
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
        toast({
          title: "No se pudieron cargar las métricas",
          description: "Intenta recargar la página.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [toast]);

  const handleQuickPriceSearch = () => {
    const term = quickPriceSearch.trim();

    if (!term) {
      router.push("/precios");
      return;
    }

    router.push(`/precios?search=${encodeURIComponent(term)}`);
  };

  const resumenEjecutivo = useMemo(() => {
    if (loading) return "Cargando información del día...";
    if (stats.visitasHoy > 0) {
      return `Hoy tienes ${stats.visitasHoy} actividad${
        stats.visitasHoy === 1 ? "" : "es"
      } programada${stats.visitasHoy === 1 ? "" : "s"} y ${
        stats.prospectos
      } prospecto${stats.prospectos === 1 ? "" : "s"} en cartera.`;
    }

    return `Tienes ${stats.clientes} clientes registrados y ${stats.seguimientos} seguimiento${
      stats.seguimientos === 1 ? "" : "s"
    } activos.`;
  }, [loading, stats]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard Comercial
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Panel de Control
            </h1>

            <p className="mt-2 text-sm text-white/75 sm:text-base">
              Visualiza tus indicadores clave, ejecuta tareas rápidas y entra a
              los módulos principales del Sales Hub.
            </p>

            <p className="mt-4 text-sm text-white/90">{resumenEjecutivo}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/agenda">Ver agenda</Link>
            </Button>

            <Button
              asChild
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/cotizaciones/nueva">Nueva cotización</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clientes activos"
          value={stats.clientes}
          subtitle="Base total de clientes registrados"
          icon={Users}
          loading={loading}
        />

        <StatCard
          title="Prospectos"
          value={stats.prospectos}
          subtitle="Oportunidades actualmente en seguimiento"
          icon={Target}
          loading={loading}
        />

        <StatCard
          title="Seguimientos"
          value={stats.seguimientos}
          subtitle="Prospectos en etapa activa"
          icon={PhoneCall}
          loading={loading}
        />

        <StatCard
          title="Visitas hoy"
          value={stats.visitasHoy}
          subtitle="Actividades programadas para hoy"
          icon={MapPin}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 xl:col-span-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Búsqueda rápida de precios</h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Escribe el nombre o código del producto y te llevamos directo a la
            sección de precios.
          </p>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 outline-none"
              />
            </div>

            <Button
              onClick={handleQuickPriceSearch}
              className="rounded-xl px-5 py-3"
            >
              Buscar precio
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Resumen ejecutivo</h2>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Clientes + Prospectos</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "..." : stats.clientes + stats.prospectos}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Carga del día</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "..." : stats.visitasHoy}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Visitas y actividades detectadas para hoy
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div>
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
          <p className="text-sm text-slate-500">
            Atajos a las tareas más frecuentes del día.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <QuickActionCard
            href="/clientes"
            label="Nuevo cliente"
            icon={Users}
          />
          <QuickActionCard
            href="/prospectos"
            label="Nuevo prospecto"
            icon={UserPlus}
          />
          <QuickActionCard
            href="/agencias"
            label="Nueva agencia"
            icon={Building2}
          />
          <QuickActionCard
            href="/agenda"
            label="Agendar visita"
            icon={Calendar}
          />
          <QuickActionCard
            href="/cotizaciones/nueva"
            label="Cotizar"
            icon={ClipboardList}
          />
          <QuickActionCard
            href="/precios"
            label="Consultar precio"
            icon={Calculator}
          />
        </div>
      </section>

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Módulos principales</h2>
          <p className="text-sm text-slate-500">
            Acceso rápido a las herramientas clave del Sales Hub.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link key={card.href} href={card.href} className="group block">
                <div className="h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {card.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}