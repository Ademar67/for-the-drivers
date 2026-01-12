import Link from "next/link";
import { Droplet, FileText } from "lucide-react";
import { ActionCard } from "@/components/ui/action-card";

const guias = [
  {
    title: "Guía de Tratamientos",
    description: "Recomendaciones de aditivos y tratamientos.",
    href: "/guias-liqui-moly/tratamientos",
    icon: <Droplet className="h-12 w-12" />,
    external: false,
  },
  {
    title: "Guía de Aceites",
    description: "Encuentra el aceite ideal para cada vehículo.",
    href: "https://www.liqui-moly.com/es/servicios/guia-de-aceites.html",
    icon: <FileText className="h-12 w-12" />,
    external: true,
  },
];

export default function GuiasLiquiMolyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Guías Liqui Moly</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guias.map((guia) => (
          <ActionCard
            key={guia.href}
            href={guia.href}
            title={guia.title}
            description={guia.description}
            icon={guia.icon}
            external={guia.external}
          />
        ))}
      </div>
    </div>
  );
}