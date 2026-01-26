import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type Ficha = {
  nombre: string;
  categoria: string;
  pdfUrl: string;
  slug: string;
  archivo: string;
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nombreBonito(filename: string) {
  // Quita extensión .pdf
  let base = filename.replace(/\.pdf$/i, "");

  // Quita códigos tipo P000123 al inicio (opcional)
  base = base.replace(/^p\d+\s*[-_ ]*/i, "");

  // Reemplaza guiones/underscores por espacios
  base = base.replace(/[-_]+/g, " ").trim();

  // Title Case simple
  base = base
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return base;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(res);
      return [res];
    })
  );
  return files.flat();
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const fichasDir = path.join(publicDir, "fichas");

    // Si no existe la carpeta, regresa vacío
    try {
      await fs.access(fichasDir);
    } catch {
      return NextResponse.json({ items: [] });
    }

    const allPaths = await walk(fichasDir);
    const pdfPaths = allPaths.filter((p) => p.toLowerCase().endsWith(".pdf"));

    const items: Ficha[] = pdfPaths.map((absPath) => {
      // absPath: /.../public/fichas/Aceite/archivo.pdf
      const relFromFichas = path.relative(fichasDir, absPath); // Aceite/archivo.pdf
      const parts = relFromFichas.split(path.sep);

      const categoria = parts.length > 1 ? parts[0] : "General";
      const archivo = parts[parts.length - 1];

      const nombre = nombreBonito(archivo);
      const slug = slugify(nombre);

      // URL pública que servirá Next
      const pdfUrl = `/fichas/${parts.join("/")}`.replaceAll("\\", "/");

      return { nombre, categoria, pdfUrl, slug, archivo };
    });

    // Ordenar por categoría y nombre
    items.sort((a, b) =>
      (a.categoria + a.nombre).localeCompare(b.categoria + b.nombre)
    );

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error leyendo fichas", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
