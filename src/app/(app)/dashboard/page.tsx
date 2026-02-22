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
  FileSearch,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

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
    title: "Materiales",
    description: "Listas de precios, catálogos y promos",
    href: "/materiales",
    icon: FileText,
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground">Accede a todas las herramientas de gestión de ventas.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link key={card.href} href={card.href} className="block">
             <Card className="h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <card.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
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
