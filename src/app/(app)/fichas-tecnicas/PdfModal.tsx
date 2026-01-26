"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
};

export default function PdfModal({ open, onClose, title, url }: Props) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        // Cierra si hacen click fuera del cuadro
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title ?? "PDF"}</p>
            <p className="truncate text-xs text-gray-500">{url ?? ""}</p>
          </div>

          <div className="flex items-center gap-2">
            {url ? (
              <>
                <a
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en pestaña
                </a>
                <a
                  className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:opacity-90"
                  href={url}
                  download
                >
                  Descargar
                </a>
              </>
            ) : null}

            <button
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="h-[75vh] bg-gray-100">
          {url ? (
            <iframe
              src={url}
              className="h-full w-full"
              title={title ?? "PDF"}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-600">
              No hay PDF seleccionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
