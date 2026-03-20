"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Copy, FilePlus2, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductCardData {
  nombre: string;
  tipo: string;
  descripcion: string;
  como_usar: string;
  cuando_usar: string[];
  cuando_no_usar: string[];
  prioridad?: "principal" | "complementario";
  objetivo?: string;
  compatibilidad?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
  isError?: boolean;
  severity?: "baja" | "media" | "alta";
  preguntasClaritficacion?: string[];
}

interface AsesorDigitalResponse {
  categoria?: string;
  sintoma?: string;
  diagnostico_orientativo?: string;
  advertencia?: string;
  severidad?: "baja" | "media" | "alta";
  preguntas_clarificacion?: string[];
  productos_recomendados?: ProductCardData[];
  error?: string;
  details?: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hola 👋 soy tu asesor Liqui Moly 💧.\n\nDescribe el síntoma, falla o condición del vehículo y te daré un diagnóstico orientativo con productos recomendados, forma de uso y precauciones.",
};

function getSeverityBadge(severity?: "baja" | "media" | "alta") {
  if (severity === "alta") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (severity === "media") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-green-100 text-green-700 border-green-200";
}

export default function SoporteIAPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const lastValidAssistantMessage = useMemo(
    () =>
      messages
        .slice()
        .reverse()
        .find((m) => m.role === "assistant" && !m.isError),
    [messages]
  );

  const handleCopy = () => {
    if (!lastValidAssistantMessage) return;

    const recommendationParts = [lastValidAssistantMessage.content];

    if (
      lastValidAssistantMessage.preguntasClarificacion &&
      lastValidAssistantMessage.preguntasClarificacion.length > 0
    ) {
      recommendationParts.push(
        "\nPreguntas de aclaración:\n- " +
          lastValidAssistantMessage.preguntasClarificacion.join("\n- ")
      );
    }

    if (
      lastValidAssistantMessage.products &&
      lastValidAssistantMessage.products.length > 0
    ) {
      const productsText = lastValidAssistantMessage.products
        .map((p, index) => {
          return (
            `\n--- PRODUCTO ${index + 1} ---\n` +
            `Nombre: ${p.nombre}\n` +
            `Tipo: ${p.tipo}\n` +
            `Prioridad: ${p.prioridad ?? "complementario"}\n` +
            `Descripción: ${p.descripcion || "Sin descripción"}\n` +
            `Objetivo: ${p.objetivo || "No especificado"}\n` +
            `Compatibilidad: ${p.compatibilidad || "No especificada"}\n` +
            `Cómo usar: ${p.como_usar || "Sin instrucciones"}\n` +
            `Cuándo usar:\n- ${(p.cuando_usar ?? []).join("\n- ")}\n` +
            `Cuándo NO usar:\n- ${(p.cuando_no_usar ?? []).join("\n- ")}`
          );
        })
        .join("\n");

      recommendationParts.push(productsText);
    }

    const textToCopy = recommendationParts.join("\n").trim();

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError("No se pudo copiar la recomendación.");
      });
  };

  const handleNewCase = () => {
    setMessages([WELCOME_MESSAGE]);
    setQuery("");
    setError(null);
    setCopied(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    const userMessage: Message = { role: "user", content: trimmedQuery };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setQuery("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/asesor-digital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data: AsesorDigitalResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            "No se pudo obtener una respuesta del asesor."
        );
      }

      if (!data?.diagnostico_orientativo) {
        throw new Error(
          "La respuesta de la API está vacía o no tiene el formato esperado."
        );
      }

      const assistantMessageContent = `${data.diagnostico_orientativo}${
        data.advertencia ? `\n\nAdvertencia: ${data.advertencia}` : ""
      }`;

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantMessageContent,
        products: Array.isArray(data.productos_recomendados)
          ? data.productos_recomendados
          : [],
        severity: data.severidad ?? "media",
        preguntasClaritficacion: Array.isArray(data.preguntas_clarificacion)
          ? data.preguntas_clarificacion
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessageContent =
        err instanceof Error
          ? err.message
          : "Lo siento, no pude procesar tu solicitud en este momento.";

      setError(errorMessageContent);

      const errorMessage: Message = {
        role: "assistant",
        content: errorMessageContent,
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-4xl flex-col rounded-lg border bg-white shadow-xl">
      <header className="flex items-center gap-4 border-b bg-gray-50/50 p-4">
        <Image
          src="/gotita.png"
          alt="Asesor Digital Liqui Moly"
          width={56}
          height={56}
          className="object-contain"
        />

        <div>
          <h1 className="text-lg font-bold text-[#00468E]">
            Asesor Digital Liqui Moly
          </h1>
          <p className="text-xs text-gray-500">
            Diagnóstico orientativo y recomendación de productos
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {lastValidAssistantMessage && !loading && (
          <div className="flex items-center gap-2 border-b pb-4">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copiado!" : "Copiar recomendación"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleNewCase}>
              <FilePlus2 className="mr-2 h-4 w-4" />
              Nuevo caso
            </Button>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-10 w-10">
                <AvatarImage src="/gotita.png" alt="Asesor Liqui Moly" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}

            <div className="flex max-w-2xl flex-col gap-1">
              {message.role === "assistant" && (
                <span className="text-xs font-semibold text-gray-700">
                  Asesor Liqui Moly
                </span>
              )}

              <div
                className={cn(
                  "rounded-lg p-3",
                  message.role === "user"
                    ? "rounded-br-none bg-blue-600 text-white"
                    : message.isError
                    ? "rounded-bl-none border border-red-200 bg-red-50 text-red-700"
                    : "rounded-bl-none bg-gray-100 text-gray-800"
                )}
              >
                {message.severity && !message.isError && (
                  <div
                    className={cn(
                      "mb-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
                      getSeverityBadge(message.severity)
                    )}
                  >
                    Severidad: {message.severity}
                  </div>
                )}

                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>

              {message.preguntasClaritficacion &&
                message.preguntasClaritficacion.length > 0 && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <strong>Preguntas de aclaración:</strong>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {message.preguntasClaritficacion.map((pregunta, i) => (
                        <li key={i}>{pregunta}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {message.products && message.products.length > 0 && (
                <div className="mt-2 grid grid-cols-1 gap-3">
                  {message.products.map((product, pIndex) => (
                    <Card
                      key={pIndex}
                      className={cn(
                        "bg-gray-50",
                        product.prioridad === "principal" &&
                          "border-blue-300 bg-blue-50"
                      )}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">
                              {product.nombre}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {product.tipo}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-semibold",
                              product.prioridad === "principal"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {product.prioridad === "principal"
                              ? "Principal"
                              : "Complementario"}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 p-4 pt-0 text-sm text-gray-600">
                        <p>
                          <strong>Descripción:</strong>{" "}
                          {product.descripcion || "Sin descripción disponible"}
                        </p>

                        {product.objetivo && (
                          <p>
                            <strong>Objetivo:</strong> {product.objetivo}
                          </p>
                        )}

                        {product.compatibilidad && (
                          <p>
                            <strong>Compatibilidad:</strong>{" "}
                            {product.compatibilidad}
                          </p>
                        )}

                        <p>
                          <strong>Modo de uso:</strong>{" "}
                          {product.como_usar || "Sin instrucciones"}
                        </p>

                        {product.cuando_usar &&
                          product.cuando_usar.length > 0 && (
                            <div>
                              <strong className="text-gray-700">
                                Cuándo usar:
                              </strong>
                              <ul className="mt-1 list-inside list-disc space-y-1">
                                {product.cuando_usar.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {product.cuando_no_usar &&
                          product.cuando_no_usar.length > 0 && (
                            <div>
                              <strong className="text-gray-700">
                                Cuándo NO usar:
                              </strong>
                              <ul className="mt-1 list-inside list-disc space-y-1">
                                {product.cuando_no_usar.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start justify-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/gotita.png" alt="Asesor Liqui Moly" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>

            <div className="flex max-w-md flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">
                Asesor Liqui Moly
              </span>

              <div className="rounded-lg rounded-bl-none bg-gray-100 p-3 text-gray-800">
                <div className="mb-2 flex justify-center">
                  <Image
                    src="/gotita.png"
                    alt="Asesor pensando"
                    width={78}
                    height={78}
                    className="animate-bounce object-contain"
                  />
                </div>

                <p className="mb-2 text-xs text-gray-500">
                  Analizando recomendación...
                </p>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe el problema del vehículo..."
            className="flex-1 resize-none"
            rows={1}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Consultando..." : "Consultar"}
          </Button>
        </form>
      </div>
    </div>
  );
}