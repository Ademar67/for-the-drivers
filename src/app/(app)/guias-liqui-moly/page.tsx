import Link from "next/link";
import { Droplet, FileText } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";

const guias = [
  {
    title: "Guía de Tratamientos",
    description: "Recomendaciones de aditivos y tratamientos.",
    href: "/guias-liqui-moly/tratamientos",
    icon: <Droplet />,
  },
  {
    title: "Guía de Aceites",
    description: "Encuentra el aceite ideal para cada vehículo.",
    href: "/guias-liqui-moly/aceites",
    icon: <FileText />,
  },
];

export default function GuiasLiquiMolyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Guías Liqui Moly</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guias.map((guia) => (
          <FeatureCard
            key={guia.href}
            href={guia.href}
            title={guia.title}
            description={guia.description}
            icon={guia.icon}
          />
        ))}
      </div>
    </div>
  );
}
