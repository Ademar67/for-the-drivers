export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Sin conexión</h1>
      <p style={{ marginTop: 12 }}>
        Estás offline. Puedes seguir viendo lo que ya estaba cargado (Clientes, Agenda, etc.).
        Cuando regrese el internet, se sincroniza solo.
      </p>

      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li>✅ Clientes / Agenda ya cargados: funcionan</li>
        <li>✅ Capturas en Firestore: se guardan y sincronizan después</li>
        <li>❌ DENUE y Mapas: requieren internet</li>
      </ul>
    </main>
  );
}
