"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type Ficha = {
  id: string;
  title: string;
  category: "Aceite" | "Mantenimiento" | "Tratamientos" | string;
  url: string;
};

type SortMode = "az" | "za";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function FichasTecnicasCliente({ initialFichas }: { initialFichas: Ficha[] }) {
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todas");
  const [sort, setSort] = React.useState<SortMode>("az");

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Ficha | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>(["Todas"]);
    for (const f of initialFichas) set.add(f.category);
    return Array.from(set).sort();
  }, [initialFichas]);

  const filtered = React.useMemo(() => {
    const nq = normalize(q);

    let rows = initialFichas.filter((f) => {
      const okCat = category === "Todas" ? true : f.category === category;
      const okQ = nq.length === 0 ? true : normalize(f.title).includes(nq);
      return okCat && okQ;
    });

    rows.sort((a, b) => {
      const A = a.title.localeCompare(b.title);
      return sort === "az" ? A : -A;
    });

    return rows;
  }, [initialFichas, q, category, sort]);

  const total = filtered.length;

  const openPdf = (f: Ficha) => {
    setSelected(f);
    setOpen(true);
  };

  return (
    <>
      {/* Controles */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ficha… (ej. 5w 30, gear, clutch)"
            className="sm:flex-1"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant={sort === "az" ? "default" : "outline"}
              onClick={() => setSort("az")}
            >
              A–Z
            </Button>
            <Button
              type="button"
              variant={sort === "za" ? "default" : "outline"}
              onClick={() => setSort("za")}
            >
              Z–A
            </Button>
          </div>
        </div>

        {/* Categorías (Tabs) */}
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex w-full flex-wrap justify-start h-auto">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Lista */}
      <div className="mt-6">
        {total === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            No hay resultados con ese filtro.
          </div>
        ) : (
          <ScrollArea className="h-[70vh] rounded-2xl border">
            <div className="divide-y">
              {filtered.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.category}</div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={() => openPdf(f)}>
                      Ver en modal
                    </Button>
                    <Button asChild>
                      <Link href={f.url} target="_blank">
                        Abrir PDF
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Modal PDF */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {selected?.title ?? "PDF"}
            </DialogTitle>
          </DialogHeader>

          <div className="h-[75vh] w-full overflow-hidden rounded-xl border">
            {selected?.url ? (
              <iframe
                title={selected.title}
                src={selected.url}
                className="h-full w-full"
              />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No hay PDF seleccionado.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
