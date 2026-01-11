'use client';

import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SoporteIAPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/asesor-digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta: query }),
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener una respuesta del asesor.');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'No se recibió una respuesta válida.',
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al consultar al asesor.');
      const errorMessage: Message = {
        role: 'assistant',
        content: err.message || 'Lo siento, no pude procesar tu solicitud en este momento.',
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
            <div
              className={cn(
                'max-w-md p-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
