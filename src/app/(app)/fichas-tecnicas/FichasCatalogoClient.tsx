"use client";

import { useMemo, useState } from "react";
import type { Ficha } from "@/lib/fichas-tecnicas";
import PdfModal from "./PdfModal";

type Props = {
  items: Ficha[];
};

export default function FichasCatalogoClient({ items = [] }: Props) {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [pdfActivo, setPdfActivo] = useState<string | null>(null);

  const categorias = useMemo(() => {
    return ["Todas", ...Array.from(new Set(items.map(f => f.categoria)))];
  }, [items]);

  const filtradas = useMemo(() => {
    return items.filter(f => {
      const matchTexto =
        f.nombre.toLowerCase().includes(query.toLowerCase()) ||
        f.archivo.toLowerCase().includes(query.toLowerCase());

      const matchCategoria =
        categoria === "Todas" || f.categoria === categoria;

      return matchTexto && matchCategoria;
    });
  }, [items, query, categoria]);

  return (
    <>
      {/* 🔍 Buscador */}
      <input
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder='Buscar… (ej: "5w-30", "diesel")'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* 🏷️ Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            className={`px-3 py-1 rounded border ${
              categoria === cat
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 📄 Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {filtradas.map(f => (
          <div key={f.slug} className="border rounded p-4">
            <h3 className="font-semibold">{f.nombre}</h3>
            <p className="text-sm text-gray-500 mb-3">{f.categoria}</p>

            <div className="flex gap-2">
              <button
                onClick={() => setPdfActivo(f.pdfUrl)}
                className="px-3 py-1 border rounded"
              >
                Ver
              </button>

              <a
                href={f.pdfUrl}
                download
                className="px-3 py-1 border rounded"
              >
                Descargar PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 🪟 Modal */}
      <PdfModal
        open={!!pdfActivo}
        url={pdfActivo ?? undefined}
        onClose={() => setPdfActivo(null)}
      />
    </>
  );
}
