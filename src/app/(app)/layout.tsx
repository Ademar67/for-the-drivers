import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { Plus, Users, UserPlus, FileText, Calendar } from "lucide-react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        {children}

        {/* Botón flotante móvil tipo Zoho */}
        <div className="fixed bottom-20 right-4 z-50 md:hidden">
          <details className="group relative">
            <summary className="flex h-14 w-14 cursor-pointer list-none items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700">
              <Plus className="h-7 w-7 transition group-open:rotate-45" />
            </summary>

            <div className="absolute bottom-16 right-0 w-56 rounded-2xl border bg-white p-2 shadow-xl">
              <Link
                href="/clientes"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-100"
              >
                <Users className="h-4 w-4 text-blue-600" />
                Nuevo cliente
              </Link>

              <Link
                href="/prospectos"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-100"
              >
                <UserPlus className="h-4 w-4 text-green-600" />
                Nuevo prospecto
              </Link>

              <Link
                href="/cotizaciones/nueva"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-100"
              >
                <FileText className="h-4 w-4 text-orange-600" />
                Nueva cotización
              </Link>

              <Link
                href="/agenda"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-100"
              >
                <Calendar className="h-4 w-4 text-purple-600" />
                Nueva visita
              </Link>
            </div>
          </details>
        </div>
      </div>
    </AuthGate>
  );
}