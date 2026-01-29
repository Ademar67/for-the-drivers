
'use client';

import { useState } from 'react';
import { Bot, User, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
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

export default function SoporteIAPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('No se pudo obtener una respuesta del asesor. Código: ' + response.status);
      }

      const data = await response.json();
      
      if (!data || !data.diagnostico_orientativo) {
         throw new Error('La respuesta de la API está vacía o no tiene el formato esperado.');
      }

      const assistantMessageContent = `${data.diagnostico_orientativo}${data.advertencia ? `\n\nAdvertencia: ${data.advertencia}` : ''}`;

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantMessageContent,
        products: data.productos_recomendados || [],
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      const errorMessageContent = err.message || 'Lo siento, no pude procesar tu solicitud en este momento.';
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
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <header className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-center text-[#00468E]">Asesor Digital Liqui Moly</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-4',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <Avatar className="w-8 h-8">
                <AvatarImage src="/icon-192x192.png" alt="Asesor" />
                <AvatarFallback>IA</AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-2 max-w-md">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {message.products && message.products.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mt-2">
                        {message.products.map((product, pIndex) => (
                            <Card key={pIndex} className="bg-gray-50">
                                <CardHeader className="p-4">
                                  <CardTitle className="text-base">{product.nombre}</CardTitle>
                                  <p className="text-sm text-muted-foreground">{product.tipo}</p>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-sm text-gray-600 space-y-3">
                                  <p><strong>Descripción:</strong> {product.descripcion}</p>
                                  <p><strong>Modo de uso:</strong> {product.como_usar}</p>
                                  
                                  {product.cuando_usar && product.cuando_usar.length > 0 && (
                                    <div>
                                        <strong className='text-gray-700'>Cuándo usar:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            {product.cuando_usar.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                  )}
                                   {product.cuando_no_usar && product.cuando_no_usar.length > 0 && (
                                    <div>
                                        <strong className='text-gray-700'>Cuándo NO usar:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            {product.cuando_no_usar.map((item, i) => <li key={i}>{item}</li>)}
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
              <Avatar className="w-8 h-8">
                 <AvatarFallback><User/></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {loading && (
            <div className="flex items-start gap-4 justify-start">
               <Avatar className="w-8 h-8">
                <AvatarImage src="/icon-192x192.png" alt="Asesor" />
                <AvatarFallback>IA</AvatarFallback>
              </Avatar>
              <div className="max-w-md p-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Describe el problema del vehículo..."
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
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
         {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
