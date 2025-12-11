import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

export default function GuiaAditivosPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <TestTube className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Guía de Aditivos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí encontrarás información
            detallada sobre los aditivos Liqui Moly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
