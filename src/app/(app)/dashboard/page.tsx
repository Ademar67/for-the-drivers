import Link from "next/link";
import {
  Users,
  Package,
  FileText,
  Calendar,
  Calculator,
  Bot,
  MapPin,
  Droplet,
  UserPlus,
  ClipboardList,
  BookOpen,
} from "lucide-react";

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
    description: "Visualiza y gestiona tus clientes y prospectos.",
    href: "/mapa-clientes",
    icon: MapPin,
  },
  {
    title: "Productos",
    description: "Catálogo",
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
    title: "Fichas Técnicas Liqui Moly",
    description: "Consulta fichas técnicas",
    href: "/fichas-tecnicas",
    icon: Calculator,
  },
  {
    title: "Asesor Digital",
    description:
      "Recomendaciones personalizadas según el problema de tu vehículo",
    href: "/soporte-ia",
    icon: Bot,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Panel de Control
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="
              group rounded-xl border bg-white p-6 shadow-sm
              transition-all duration-200
              hover:-translate-y-1 hover:shadow-lg hover:border-blue-600 hover:bg-blue-50
              focus:outline-none focus:ring-2 focus:ring-blue-600
            "
          >
            <div className="flex flex-col gap-4">
              <card.icon className="h-10 w-10 text-blue-600 group-hover:scale-110 transition" />

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
