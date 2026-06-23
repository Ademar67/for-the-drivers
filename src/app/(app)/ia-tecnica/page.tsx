"use client";

import { useState } from "react";

export default function IATecnicaPage() {
  const [consulta, setConsulta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loading, setLoading] = useState(false);

  const consultarIA = async () => {
    if (!consulta.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/ia-tecnica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consulta,
        }),
      });

      const data = await response.json();

      setRespuesta(data.respuesta);
    } catch (error) {
      console.error(error);
      setRespuesta("Error al consultar la IA.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IA Técnica Liqui Moly</h1>

        <p className="text-muted-foreground">
          Consulta aplicaciones, aceites, transmisiones y recomendaciones
          técnicas.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <textarea
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Ejemplo: Chevrolet Sonic 2013 1.4 automático"
          className="w-full rounded-md border p-3 min-h-[120px]"
        />

        <button
          onClick={consultarIA}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </div>

      {respuesta && (
        <div className="rounded-lg border p-6 whitespace-pre-wrap">
          {respuesta}
        </div>
      )}
    </div>
  );
}
