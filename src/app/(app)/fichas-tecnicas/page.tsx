import { getFichasTecnicas } from "@/lib/fichas-tecnicas";
import FichasCatalogoClient from "./FichasCatalogoClient";

export const runtime = "nodejs";

export default async function FichasTecnicasPage() {
  const { items, error, detail } = await getFichasTecnicas();

  // Si hay error, mostramos mensaje simple (no rompe nada)
  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Fichas Técnicas</h1>
        <p className="mt-3 text-sm text-red-600">
          Error cargando fichas: {error}
        </p>
        {detail ? (
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border p-3 text-xs text-muted-foreground">
            {detail}
          </pre>
        ) : null}
      </div>
    );
  }

  return <FichasCatalogoClient items={items} />;
}
