'use client';

import { useState } from 'react';
import { Calculator, Sparkles, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  recommendProducts,
  type ProductRecommendationOutput,
} from '@/ai/flows/product-recommendation-engine';
import { useToast } from '@/hooks/use-toast';

export default function ProductCalculatorPage() {
  const [customerNeeds, setCustomerNeeds] = useState('');
  const [recommendation, setRecommendation] =
    useState<ProductRecommendationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNeeds.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, describe las necesidades del cliente.',
      });
      return;
    }
    setIsLoading(true);
    setRecommendation(null);
    try {
      const result = await recommendProducts({ customerNeeds });
      setRecommendation(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'No se pudieron obtener las recomendaciones. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Calculator className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">
          Calculadora de Productos
        </h1>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Describe las necesidades</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ej: Necesito aceite para un BMW 320d 2018 con alto kilometraje, usado principalmente en ciudad..."
                value={customerNeeds}
                onChange={(e) => setCustomerNeeds(e.target.value)}
                rows={6}
                className="resize-none"
                disabled={isLoading}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Obtener Recomendación
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex items-center justify-center">
          {isLoading && (
            <div className="text-center text-muted-foreground">
              <LoaderCircle className="w-12 h-12 mx-auto animate-spin" />
              <p className="mt-4">
                Buscando los mejores productos para tu cliente...
              </p>
            </div>
          )}
          {recommendation && (
            <Card className="w-full animate-in fade-in-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Productos Recomendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-foreground">
                  {recommendation.recommendedProducts
                    .split('\n')
                    .map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
          {!isLoading && !recommendation && (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-full flex items-center justify-center">
              <p>Las recomendaciones de productos aparecerán aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
