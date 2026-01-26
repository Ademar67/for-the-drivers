import { getFichasTecnicas } from "@/lib/fichas-tecnicas";

export default async function FichasTecnicasPage() {
  const { items, error, detail } = await getFichasTecnicas();

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Fichas Técnicas</h1>
        <p style={{ marginTop: 12, color: "crimson" }}>
          Error cargando fichas: {detail}
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Fichas Técnicas</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        Total de fichas: {items?.length ?? 0}
      </p>

      <div style={{ marginTop: 24 }}>
        {(items || []).map((ficha: any) => (
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
