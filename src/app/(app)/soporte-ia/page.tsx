"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Copy,
  FilePlus2,
  User,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  MessageSquareText,
  Wrench,
} from "lucide-react";

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

interface SpeechVenta {
  corto?: string;
  tecnico_comercial?: string;
  objecion_precio?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
  isError?: boolean;
  severity?: "baja" | "media" | "alta";
  preguntasClarificacion?: string[];
  categoria?: string;
  sintoma?: string;
  advertencia?: string;
  speechVenta?: SpeechVenta;
}

interface AsesorDigitalResponse {
  categoria?: string;
  sintoma?: string;
  diagnostico_orientativo?: string;
  advertencia?: string;
  severidad?: "baja" | "media" | "alta";
  preguntas_clarificacion?: string[];
  productos_recomendados?: ProductCardData[];
  speech_venta?: SpeechVenta;
  error?: string;
  details?: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hola 👋 soy tu asesor Liqui Moly.\n\nDescríbeme el síntoma, falla o necesidad del vehículo y te daré un diagnóstico orientativo, preguntas de aclaración y productos recomendados.",
};

function getSeverityBadge(severity?: "baja" | "media" | "alta") {
  if (severity === "alta") {
    return "border-red-200 bg-red-100 text-red-700";
  }
  if (severity === "media") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

function buildCopyText(message?: Message | null) {
  if (!message) return "";

  const parts: string[] = [];

  if (message.categoria) {
    parts.push(`Categoría: ${message.categoria}`);
  }

  if (message.sintoma) {
    parts.push(`Síntoma detectado: ${message.sintoma}`);
  }

  if (message.severity) {
    parts.push(`Severidad: ${message.severity}`);
  }

  parts.push(`\nDiagnóstico orientativo:\n${message.content}`);

  if (message.advertencia) {
    parts.push(`\nAdvertencia:\n${message.advertencia}`);
  }

  if (message.preguntasClarificacion?.length) {
    parts.push(
      `\nPreguntas de aclaración:\n- ${message.preguntasClarificacion.join("\n- ")}`
    );
  }

  if (message.products?.length) {
    const productsText = message.products
      .map((p, index) => {
        return [
          `\n--- PRODUCTO ${index + 1} ---`,
          `Nombre: ${p.nombre || "Sin nombre"}`,
          `Tipo: ${p.tipo || "Sin tipo"}`,
          `Prioridad: ${p.prioridad ?? "complementario"}`,
          `Descripción: ${p.descripcion || "Sin descripción"}`,
          `Objetivo: ${p.objetivo || "No especificado"}`,
          `Compatibilidad: ${p.compatibilidad || "No especificada"}`,
          `Cómo usar: ${p.como_usar || "Sin instrucciones"}`,
          `Cuándo usar:\n- ${
            p.cuando_usar?.length ? p.cuando_usar.join("\n- ") : "No especificado"
          }`,
          `Cuándo NO usar:\n- ${
            p.cuando_no_usar?.length
              ? p.cuando_no_usar.join("\n- ")
              : "No especificado"
          }`,
        ].join("\n");
      })
      .join("\n");

    parts.push(productsText);
  }

  if (message.speechVenta) {
    if (message.speechVenta.corto) {
      parts.push(`\nPitch corto:\n${message.speechVenta.corto}`);
    }
    if (message.speechVenta.tecnico_comercial) {
      parts.push(
        `\nArgumento técnico-comercial:\n${message.speechVenta.tecnico_comercial}`
      );
    }
    if (message.speechVenta.objecion_precio) {
      parts.push(
        `\nRespuesta a objeción por precio:\n${message.speechVenta.objecion_precio}`
      );
    }
  }

  return parts.join("\n").trim();
}

export default function SoporteIAPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [query]);

  const lastValidAssistantMessage = useMemo(
    () =>
      messages
        .slice()
        .reverse()
        .find((m) => m.role === "assistant" && !m.isError),
    [messages]
  );

  const handleCopy = async () => {
    const textToCopy = buildCopyText(lastValidAssistantMessage);
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar la recomendación.");
    }
  };

  const handleNewCase = () => {
    setMessages([WELCOME_MESSAGE]);
    setQuery("");
    setError(null);
    setCopied(false);
  };

  const handleCopySection = async (text?: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("No se pudo copiar el texto.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmedQuery,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setQuery("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/asesor-digital", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerNeeds: trimmedQuery,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          maxProducts: 5,
          includeComplementaryProducts: true,
          responseStyle: "professional",
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
          "La respuesta de la API llegó vacía o no tiene el formato esperado."
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.diagnostico_orientativo,
        advertencia: data.advertencia,
        products: Array.isArray(data.productos_recomendados)
          ? data.productos_recomendados
          : [],
        severity: data.severidad ?? "media",
        preguntasClarificacion: Array.isArray(data.preguntas_clarificacion)
          ? data.preguntas_clarificacion
          : [],
        categoria: data.categoria,
        sintoma: data.sintoma,
        speechVenta: data.speech_venta,
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
    <div className="mx-auto flex h-[calc(100vh-80px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <header className="border-b bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <Image
              src="/gotita.png"
              alt="Asesor Digital Liqui Moly"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[#00468E] sm:text-xl">
              Asesor Digital Liqui Moly
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Diagnóstico orientativo, recomendación de productos y apoyo de venta
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-6">
        {lastValidAssistantMessage && !loading && (
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copiado" : "Copiar recomendación"}
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
              "flex items-start gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="mt-1 h-10 w-10 border bg-white shadow-sm">
                <AvatarImage src="/gotita.png" alt="Asesor Liqui Moly" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}

            <div className="flex w-full max-w-3xl flex-col gap-2">
              <div
                className={cn(
                  "rounded-2xl p-4 shadow-sm",
                  message.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : message.isError
                    ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                )}
              >
                {message.role === "assistant" && !message.isError && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {message.severity && (
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getSeverityBadge(message.severity)
                        )}
                      >
                        Severidad: {message.severity}
                      </span>
                    )}

                    {message.categoria && (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Categoría: {message.categoria}
                      </span>
                    )}

                    {message.sintoma && (
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Síntoma: {message.sintoma}
                      </span>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </p>

                {message.advertencia && !message.isError && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      <ShieldAlert className="h-4 w-4" />
                      Advertencia
                    </div>
                    <p className="leading-6">{message.advertencia}</p>
                  </div>
                )}
              </div>

              {message.preguntasClarificacion &&
                message.preguntasClarificacion.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
                        <Sparkles className="h-4 w-4" />
                        Preguntas de aclaración
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-amber-900">
                      <ul className="list-inside list-disc space-y-1">
                        {message.preguntasClarificacion.map((pregunta, i) => (
                          <li key={i}>{pregunta}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {message.products && message.products.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {message.products.map((product, pIndex) => (
                    <Card
                      key={pIndex}
                      className={cn(
                        "shadow-sm",
                        product.prioridad === "principal"
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <CardHeader className="p-4 pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <CardTitle className="text-base text-slate-900">
                              {product.nombre}
                            </CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
                              {product.tipo}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
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

                      <CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-700">
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

                        {product.cuando_usar?.length > 0 && (
                          <div>
                            <strong className="text-slate-900">Cuándo usar:</strong>
                            <ul className="mt-1 list-inside list-disc space-y-1">
                              {product.cuando_usar.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {product.cuando_no_usar?.length > 0 && (
                          <div>
                            <strong className="text-slate-900">
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

              {message.speechVenta &&
                (message.speechVenta.corto ||
                  message.speechVenta.tecnico_comercial ||
                  message.speechVenta.objecion_precio) && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm text-slate-900">
                        <MessageSquareText className="h-4 w-4" />
                        Apoyo comercial
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-sm text-slate-700">
                      {message.speechVenta.corto && (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="mb-1 font-semibold text-slate-900">
                            Pitch corto
                          </div>
                          <p className="leading-6">{message.speechVenta.corto}</p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopySection(message.speechVenta?.corto)
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}

                      {message.speechVenta.tecnico_comercial && (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="mb-1 font-semibold text-slate-900">
                            Argumento técnico-comercial
                          </div>
                          <p className="leading-6">
                            {message.speechVenta.tecnico_comercial}
                          </p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopySection(
                                  message.speechVenta?.tecnico_comercial
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}

                      {message.speechVenta.objecion_precio && (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="mb-1 font-semibold text-slate-900">
                            Respuesta a objeción por precio
                          </div>
                          <p className="leading-6">
                            {message.speechVenta.objecion_precio}
                          </p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopySection(
                                  message.speechVenta?.objecion_precio
                                )
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>

            {message.role === "user" && (
              <Avatar className="mt-1 h-9 w-9 border bg-white shadow-sm">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start justify-start gap-3">
            <Avatar className="mt-1 h-10 w-10 border bg-white shadow-sm">
              <AvatarImage src="/gotita.png" alt="Asesor Liqui Moly" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>

            <div className="max-w-md rounded-2xl rounded-bl-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex justify-center">
                <Image
                  src="/gotita.png"
                  alt="Asesor pensando"
                  width={74}
                  height={74}
                  className="animate-bounce object-contain"
                />
              </div>

              <p className="mb-3 text-sm font-medium text-slate-700">
                Analizando recomendación...
              </p>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Wrench className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ejemplo: Camioneta con humo azul, consumo de aceite y 120,000 km..."
              className="min-h-[52px] resize-none rounded-xl pl-10 pr-3"
              rows={2}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-[52px] rounded-xl px-6"
          >
            {loading ? "Consultando..." : "Consultar"}
          </Button>
        </form>
      </div>
    </div>
  );
}