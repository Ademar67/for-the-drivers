"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    description: "Recomendaciones personalizadas según el problema del vehículo",
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
  const [stats, setStats] = useState<DashboardStats>({
    clientes: 0,
    prospectos: 0,
    seguimientos: 0,
    visitasHoy: 0,
  });

  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Panel de Control
        </h1>

        <p className="text-muted-foreground">
          Accede rápidamente a todas las herramientas de gestión comercial.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Clientes activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.clientes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Prospectos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.prospectos}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Seguimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.seguimientos}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Visitas hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.visitasHoy}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <Card className="h-full border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
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