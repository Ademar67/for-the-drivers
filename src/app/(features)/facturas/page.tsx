import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function FacturasPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Receipt className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Gestión de Facturas</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí podrás gestionar el cobro de
            facturas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
