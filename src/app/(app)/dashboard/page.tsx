
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  Package,
  FileText,
  Calendar,
  Calculator,
  Bot,
  MapPin,
  Droplet,
  Map,
  UserPlus,
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
    title: "Pedidos",
    description: "Órdenes y ventas",
    href: "/pedidos",
    icon: ShoppingCart,
  },
  {
    title: "Agenda de Visitas",
    description: "Tareas, visitas y cotizaciones",
    href: "/agenda",
    icon: Calendar,
  },
 
  {
    title: "Mapa de Clientes",
    description: "Visualiza y gestiona tus clientes y prospectos.",
    href: "/mapa-clientes",
    icon: MapPin,
  },
   {
    title: "Mapa de Visitas",
    description: "Visualiza tus visitas en el mapa.",
    href: "/mapa-visitas",
    icon: Map,
  },
  {
    title: "Productos",
    description: "Catálogo",
    href: "/productos",
    icon: Package,
  },
  {
    title: "Facturas",
    description: "Facturación y cobros",
    href: "/facturas",
    icon: FileText,
  },
  {
    title: "Guias Liqui Moly",
    description: "Descubre el Producto ideal para cada necesidad.",
    href: "/guias-liqui-moly",
    icon: Droplet,
  },
  {
    title: "Calculadora de productos",
    description: "Obtén recomendaciones de productos por IA.",
    href: "/calculadora",
    icon: Calculator,
  },
  {
    title: "Soporte IA",
    description: "Asistente inteligente",
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
