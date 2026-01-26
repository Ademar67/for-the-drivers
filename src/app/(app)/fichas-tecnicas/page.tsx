import { getFichasTecnicas } from "@/lib/fichas-tecnicas";
import FichasTecnicasCliente from "./fichas-tecnicas-cliente";

export default async function FichasTecnicasPage() {
  const { items } = await getFichasTecnicas();

  // The 'Ficha' type in the client component is simpler, so we format the data here.
  const formattedItems = items.map((item, index) => ({
    id: item.slug || `${index}`,
    title: item.nombre,
    category: item.categoria,
    url: item.pdfUrl,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Fichas Técnicas</h1>
        <p className="text-sm text-muted-foreground">
          Total de fichas: {formattedItems.length}
        </p>
      </div>
      <FichasTecnicasCliente initialFichas={formattedItems} />
    </div>
  );
}
