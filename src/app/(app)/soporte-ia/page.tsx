'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Copy, FilePlus2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ProductCardData {
  nombre: string;
  tipo: string;
  descripcion: string;
  como_usar: string;
  cuando_usar: string[];
  cuando_no_usar: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCardData[];
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    'Hola 👋 soy tu asesor Liqui Moly 💧.\n\nDescribe el síntoma o problema del vehículo y te recomendaré el producto adecuado.',
};

export default function SoporteIAPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  const lastValidAssistantMessage = useMemo(
    () =>
      messages
        .slice()
        .reverse()
        .find(
          m =>
            m.role === 'assistant' &&
            !m.content.toLowerCase().includes('lo siento')
        ),
    [messages]
  );

  const handleCopy = () => {
    if (!lastValidAssistantMessage) return;

    const recommendationParts = [lastValidAssistantMessage.content];

    if (
      lastValidAssistantMessage.products &&
      lastValidAssistantMessage.products.length > 0
    ) {
      const productsText = lastValidAssistantMessage.products
        .map(p => {
          return (
            `\n--- PRODUCTO RECOMENDADO ---\n` +
            `Nombre: ${p.nombre}\n` +
            `Tipo: ${p.tipo}\n` +
            `Descripción: ${p.descripcion}\n` +
            `Cómo usar: ${p.como_usar}\n` +
            `Cuándo usar:\n- ${p.cuando_usar.join('\n- ')}\n` +
            `Cuándo NO usar:\n- ${p.cuando_no_usar.join('\n- ')}`
          );
        })
        .join('\n');

      recommendationParts.push(productsText);
    }

    const textToCopy = recommendationParts.join('\n').trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNewCase = () => {
    setMessages([WELCOME_MESSAGE]);
    setQuery('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    const currentQuery = query;
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/asesor-digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery }),
      });

      if (!response.ok) {
        throw new Error(
          'No se pudo obtener una respuesta del asesor. Código: ' +
            response.status
        );
      }

      const data = await response.json();

      if (!data || !data.diagnostico_orientativo) {
        throw new Error(
          'La respuesta de la API está vacía o no tiene el formato esperado.'
        );
      }

      const assistantMessageContent = `${data.diagnostico_orientativo}${
        data.advertencia ? `\n\nAdvertencia: ${data.advertencia}` : ''
      }`;

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantMessageContent,
        products: data.productos_recomendados || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessageContent =
        err.message ||
        'Lo siento, no pude procesar tu solicitud en este momento.';

      setError(errorMessageContent);

      const errorMessage: Message = {
        role: 'assistant',
        content: errorMessageContent,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-3xl flex-col rounded-lg border bg-white shadow-xl">
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
            Recomendaciones de productos (MX)
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {lastValidAssistantMessage && !loading && (
          <div className="flex items-center gap-2 border-b pb-4">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copiado!' : 'Copiar recomendación'}
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
              'flex items-start gap-4',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-10 w-10">
                <AvatarImage src="/gotita.png" alt="Asesor Liqui Moly" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}

            <div className="flex max-w-md flex-col gap-1">
              {message.role === 'assistant' && (
                <span className="text-xs font-semibold text-gray-700">
                  Asesor Liqui Moly
                </span>
              )}

              <div
                className={cn(
                  'rounded-lg p-3',
                  message.role === 'user'
                    ? 'rounded-br-none bg-blue-600 text-white'
                    : 'rounded-bl-none bg-gray-100 text-gray-800'
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>

              {message.products && message.products.length > 0 && (
                <div className="mt-2 grid grid-cols-1 gap-3">
                  {message.products.map((product, pIndex) => (
                    <Card key={pIndex} className="bg-gray-50">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">
                          {product.nombre}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {product.tipo}
                        </p>
                      </CardHeader>

                      <CardContent className="space-y-3 p-4 pt-0 text-sm text-gray-600">
                        <p>
                          <strong>Descripción:</strong> {product.descripcion}
                        </p>

                        <p>
                          <strong>Modo de uso:</strong> {product.como_usar}
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

            {message.role === 'user' && (
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
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Describe el problema del vehículo..."
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Consultando...' : 'Consultar'}
          </Button>
        </form>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}