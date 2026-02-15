"use client";

import { useMemo, useState } from "react";
import { MATERIALES, type MaterialCategory } from "@/lib/materiales-manifest";

const CATEGORY_LABEL: Record<MaterialCategory | "ALL", string> = {
  ALL: "Todos",
  LISTA_PRECIOS: "Lista de precios",
  TRIPTICO: "Trípticos",
  CATALOGO: "Catálogos",
  PROMO: "Promos",
  OTRO: "Otro",
};

function categoryBadgeText(cat: MaterialCategory) {
  return CATEGORY_LABEL[cat] ?? cat;
}

export default function MaterialesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MaterialCategory | "ALL">("ALL");

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();

    return MATERIALES.filter((m) => {
      const active = m.isActive !== false; // default true
      const catOk = cat === "ALL" ? true : m.category === cat;

      const haystack =
        (m.title ?? "") +
        " " +
        (m.description ?? "") +
        " " +
        (m.tags ?? []).join(" ");

      const qOk = query.length === 0 ? true : haystack.toLowerCase().includes(query);

      // si quieres ocultar inactivos completamente, descomenta:
      // return active && catOk && qOk;

      // si quieres mostrarlos pero atenuados (recomendado):
      return catOk && qOk;
    });
  }, [q, cat]);

  const onCopy = async (file: string) => {
    try {
      const absolute = `${window.location.origin}${file}`;
      await navigator.clipboard.writeText(absolute);
      alert("Link copiado ✅");
    } catch {
      alert("No pude copiar el link (permiso del navegador).");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Material de Apoyo</h1>
        <p className="text-sm text-muted-foreground">
          Encuentra listas de precios, catálogos, promociones y más.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o tags…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as any)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="ALL">{CATEGORY_LABEL.ALL}</option>
            <option value="LISTA_PRECIOS">{CATEGORY_LABEL.LISTA_PRECIOS}</option>
            <option value="TRIPTICO">{CATEGORY_LABEL.TRIPTICO}</option>
            <option value="CATALOGO">{CATEGORY_LABEL.CATALOGO}</option>
            <option value="PROMO">{CATEGORY_LABEL.PROMO}</option>
            <option value="OTRO">{CATEGORY_LABEL.OTRO}</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No hay materiales con esos filtros.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const inactive = m.isActive === false;

            return (
              <div
                key={m.id}
                className={`rounded-xl border p-4 shadow-sm space-y-3 ${
                  inactive ? "opacity-50" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug">{m.title}</h2>
                    {inactive ? (
                      <span className="text-xs rounded-full border px-2 py-0.5">
                        Inactivo
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs rounded-full bg-black/5 px-2 py-0.5">
                      {categoryBadgeText(m.category)}
                    </span>
                    <span className="text-xs rounded-full bg-black/5 px-2 py-0.5">
                      {m.file.toLowerCase().endsWith(".pdf")
                        ? "PDF"
                        : m.file.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/)
                        ? "IMG"
                        : m.file.toLowerCase().match(/\.(xls|xlsx)$/)
                        ? "XLS"
                        : m.file.toLowerCase().match(/\.(doc|docx)$/)
                        ? "DOC"
                        : "OTRO"}
                    </span>
                  </div>

                  {m.description ? (
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                  ) : null}

                  {m.tags && m.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.tags.map((t) => (
                        <span key={t} className="text-xs rounded-md border px-2 py-0.5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={m.file}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                  >
                    Ver
                  </a>
                  <a
                    href={m.file}
                    download
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                  >
                    Descargar
                  </a>
                  <button
                    onClick={() => onCopy(m.file)}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                    type="button"
                  >
                    Copiar link
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}