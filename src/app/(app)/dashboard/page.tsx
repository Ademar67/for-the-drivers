"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  Boxes,
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  MapPin,
  Package,
  PhoneCall,
  Search,
  Sparkles,
  Target,
  UserPlus,
  Users,
  CheckCircle2,
  Briefcase,
  Zap,
  ArrowRight,
  Truck,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modules = [
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Prospectos", href: "/prospectos", icon: UserPlus },
  { title: "Flotillas", href: "/flotillas", icon: Truck },
  { title: "Agencias", href: "/agencias", icon: Building2 },
  { title: "Agenda", href: "/agenda", icon: Calendar },
  { title: "Cotizaciones", href: "/cotizaciones", icon: ClipboardList },
  { title: "Precios", href: "/precios", icon: Calculator },
  { title: "Inventario", href: "/inventario", icon: Boxes },
  { title: "Mapa de Clientes", href: "/mapa-clientes", icon: MapPin },
  { title: "Productos", href: "/productos", icon: Package },
  { title: "Cobranza", href: "/facturas", icon: FileText },
  { title: "Guías", href: "/guias-liqui-moly", icon: BookOpen },
  { title: "Fichas Técnicas", href: "/fichas-tecnicas", icon: FolderKanban },
  { title: "Materiales", href: "/materiales", icon: FileText },
  { title: "Asesor IA", href: "/soporte-ia", icon: Bot },
];

type Stats = {
  clientes: number;
  prospectos: number;
  seguimientos: number;
  visitasHoy: number;
  cotizaciones: number;
  cobranzaPendiente: number;
  totalCotizadoMes: number;
  prospectosPendientesHoy: number;
  tasaConversion: number;
};

type UltimaCotizacion = {
  id: string;
  clienteNombre: string;
  total: number;
  createdAt: any;
};

function KPI({
  title,
  value,
  icon: Icon,
  loading,
  prefix = "",
  suffix = "",
  color = "blue",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  prefix?: string;
  suffix?: string;
  color?: "blue" | "green" | "orange" | "purple";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const formatted = prefix === "$"
    ? `$${value.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `${prefix}${value}${suffix}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {loading ? "..." : formatted}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  subtitle,
  icon: Icon,
  tone = "default",
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        tone === "primary" ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          tone === "primary" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<Stats>({
    clientes: 0,
    prospectos: 0,
    seguimientos: 0,
    visitasHoy: 0,
    cotizaciones: 0,
    cobranzaPendiente: 0,
    totalCotizadoMes: 0,
    prospectosPendientesHoy: 0,
    tasaConversion: 0,
  });

  const [ultimasCotizaciones, setUltimasCotizaciones] = useState<UltimaCotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    let mounted = true;

    async function loadDashboard() {
      try {
        const uid = user!.uid;
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const hoyStr = ahora.toISOString().split("T")[0];

        const [
          clientesSnap,
          cotizacionesSnap,
          facturasSnap,
          visitasSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, "clientes"), where("ownerId", "==", uid))).catch(() => null),
          getDocs(query(collection(db, "cotizaciones"), where("ownerId", "==", uid))).catch(() => null),
          getDocs(query(collection(db, "facturas"), where("ownerId", "==", uid))).catch(() => null),
          getDocs(query(collection(db, "visitas"), where("ownerId", "==", uid))).catch(() => null),
        ]);

        const clientes = clientesSnap?.docs.map(d => ({ id: d.id, ...d.data() as any })) ?? [];
        const totalClientes = clientes.filter((c: any) => c.tipo === "cliente").length;
        const totalProspectos = clientes.filter((c: any) => c.tipo === "prospecto").length;
        const totalSeguimientos = clientes.filter((c: any) => c.estadoProspecto === "seguimiento").length;

        // Prospectos para hoy
        const prospectosPendientesHoy = clientes.filter((c: any) => {
          if (c.tipo !== "prospecto" || !c.proximaVisita) return false;
          try {
            const fecha = typeof c.proximaVisita?.toDate === "function"
              ? c.proximaVisita.toDate()
              : new Date(c.proximaVisita);
            return fecha.toISOString().split("T")[0] === hoyStr;
          } catch { return false; }
        }).length;

        // Cotizaciones
        const cotizaciones = cotizacionesSnap?.docs.map(d => ({ id: d.id, ...d.data() as any })) ?? [];
        const totalCotizaciones = cotizaciones.length;

        // Total cotizado este mes
        const totalCotizadoMes = cotizaciones
          .filter((c: any) => {
            try {
              const fecha = typeof c.createdAt?.toDate === "function"
                ? c.createdAt.toDate()
                : new Date(c.createdAt);
              return fecha >= inicioMes;
            } catch { return false; }
          })
          .reduce((acc: number, c: any) => acc + Number(c.total ?? 0), 0);

        // Últimas 3 cotizaciones
        const ultimas = [...cotizaciones]
          .sort((a: any, b: any) => {
            const aT = typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
            const bT = typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
            return bT - aT;
          })
          .slice(0, 3)
          .map((c: any) => ({
            id: c.id,
            clienteNombre: c.clienteNombre ?? "Cliente",
            total: Number(c.total ?? 0),
            createdAt: c.createdAt,
          }));

        // Tasa de conversión (clientes / (clientes + prospectos))
        const totalCRM = totalClientes + totalProspectos;
        const tasaConversion = totalCRM > 0 ? Math.round((totalClientes / totalCRM) * 100) : 0;

        // Visitas hoy
        const visitasHoy = visitasSnap?.docs.filter(d => {
          const fecha = d.data()?.fecha;
          return typeof fecha === "string" && fecha.startsWith(hoyStr);
        }).length ?? 0;

        // Cobranza pendiente
        const cobranzaPendiente = facturasSnap?.docs.filter(d => {
          const estado = String(d.data()?.estado ?? "").toLowerCase().trim();
          return estado !== "pagada" && estado !== "pagado";
        }).length ?? 0;

        if (!mounted) return;

        setStats({
          clientes: totalClientes,
          prospectos: totalProspectos,
          seguimientos: totalSeguimientos,
          visitasHoy,
          cotizaciones: totalCotizaciones,
          cobranzaPendiente,
          totalCotizadoMes,
          prospectosPendientesHoy,
          tasaConversion,
        });

        setUltimasCotizaciones(ultimas);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [user, authLoading]);

  const prioridad = useMemo(() => {
    if (loading) return "Cargando operación...";
    if (stats.prospectosPendientesHoy > 0)
      return `Hoy tienes ${stats.prospectosPendientesHoy} prospecto${stats.prospectosPendientesHoy === 1 ? "" : "s"} programado${stats.prospectosPendientesHoy === 1 ? "" : "s"}. Empieza por ahí.`;
    if (stats.visitasHoy > 0)
      return `Hoy tienes ${stats.visitasHoy} visita${stats.visitasHoy === 1 ? "" : "s"}. Empieza por ahí.`;
    if (stats.seguimientos > 0)
      return `Tienes ${stats.seguimientos} seguimiento${stats.seguimientos === 1 ? "" : "s"} activo${stats.seguimientos === 1 ? "" : "s"}. Buen momento para cerrar.`;
    if (stats.prospectos > 0)
      return `Tienes ${stats.prospectos} prospecto${stats.prospectos === 1 ? "" : "s"}. Momento de abrir mercado.`;
    return "Todo tranquilo. Enfócate en cotizar y prospectar.";
  }, [loading, stats]);

  const resumen = useMemo(() => {
    if (loading) return "Cargando métricas del día...";
    return `Clientes: ${stats.clientes} · Prospectos: ${stats.prospectos} · Cotizaciones: ${stats.cotizaciones} · Cobranza pendiente: ${stats.cobranzaPendiente}`;
  }, [loading, stats]);

  const goSearch = () => {
    const term = search.trim();
    router.push(term ? `/precios?search=${encodeURIComponent(term)}` : "/precios");
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard Comercial
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Panel de Control
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{prioridad}</p>
            <p className="mt-2 text-sm text-white/65">{resumen}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/cotizaciones/nueva">Cotizar</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/agenda">Agenda</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/prospectos">Seguimiento</Link>
              </Button>
            </div>
          </div>

          <Link href="/soporte-ia" className="group rounded-3xl border border-blue-300/20 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                <Bot className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-blue-100/80">Herramienta destacada</p>
                <h2 className="mt-1 text-xl font-bold text-white">IA Vendedor</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80">Recomienda productos, responde objeciones y te ayuda a vender más pro.</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Abrir asesor
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KPI title="Clientes" value={stats.clientes} icon={Users} loading={loading} color="blue" />
        <KPI title="Prospectos" value={stats.prospectos} icon={Target} loading={loading} color="purple" />
        <KPI title="Seguimientos" value={stats.seguimientos} icon={PhoneCall} loading={loading} color="orange" />
        <KPI title="Visitas hoy" value={stats.visitasHoy} icon={MapPin} loading={loading} color="green" />
        <KPI title="Cotizaciones" value={stats.cotizaciones} icon={CheckCircle2} loading={loading} color="blue" />
        <KPI title="Cobranza" value={stats.cobranzaPendiente} icon={Briefcase} loading={loading} color="orange" />
      </div>

      {/* Métricas comerciales */}
      <div className="grid gap-3 md:grid-cols-3">
        <KPI title="Cotizado este mes" value={stats.totalCotizadoMes} icon={DollarSign} loading={loading} prefix="$" color="green" />
        <KPI title="Para hoy" value={stats.prospectosPendientesHoy} icon={Calendar} loading={loading} color="orange" />
        <KPI title="Tasa de conversión" value={stats.tasaConversion} icon={TrendingUp} loading={loading} suffix="%" color="purple" />
      </div>

      {/* Últimas cotizaciones */}
      {!loading && ultimasCotizaciones.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Últimas cotizaciones</h2>
            <Link href="/cotizaciones" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {ultimasCotizaciones.map((cot) => {
              const fecha = typeof cot.createdAt?.toDate === "function"
                ? cot.createdAt.toDate().toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
                : "—";
              return (
                <div key={cot.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{cot.clienteNombre}</p>
                    <p className="text-xs text-slate-500">{fecha}</p>
                  </div>
                  <p className="font-bold text-green-600">
                    ${cot.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <QuickAction href="/cotizaciones/nueva" title="Nueva cotización" subtitle="Arranca una propuesta rápida para cerrar venta." icon={ClipboardList} tone="primary" />
        <QuickAction href="/agenda" title="Agendar visita" subtitle="Programa tu siguiente movimiento comercial." icon={Calendar} />
        <QuickAction href="/prospectos" title="Dar seguimiento" subtitle="Empuja oportunidades activas y prospectos." icon={PhoneCall} />
        <QuickAction href="/soporte-ia" title="Usar IA vendedor" subtitle="Obtén recomendación de producto y argumento." icon={Bot} />
        <QuickAction href="/precios" title="Consultar precios" subtitle="Ve directo al catálogo de precios." icon={Calculator} />
        <QuickAction href="/clientes" title="Nuevo cliente" subtitle="Registra o actualiza tu cartera." icon={Users} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Precio rápido</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">Escribe nombre o código y entra directo a la búsqueda.</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-blue-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
            />
          </div>
          <Button onClick={goSearch} className="rounded-xl px-5">Buscar</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Módulos principales</h2>
          <p className="text-sm text-slate-500">Acceso rápido a las herramientas del Sales Hub.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">{m.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}