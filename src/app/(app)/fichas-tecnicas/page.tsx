import { headers } from "next/headers";

export default async function FichasTecnicasPage() {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/fichas-tecnicas`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Fichas Técnicas</h1>
        <p style={{ marginTop: 12, color: "crimson" }}>
          Error cargando fichas: {res.status} {res.statusText}
        </p>
      </main>
    );
  }

  const data = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Fichas Técnicas</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        Total de fichas: {data.items?.length ?? 0}
      </p>

      <div style={{ marginTop: 24 }}>
        {(data.items || []).map((ficha: any) => (
          <div
            key={ficha.pdfUrl}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <strong>{ficha.nombre}</strong>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              Categoría: {ficha.categoria}
            </div>

            <a href={ficha.pdfUrl} target="_blank" rel="noreferrer">
              Ver PDF
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
