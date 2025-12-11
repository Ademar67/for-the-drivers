import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function PedidosPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Package className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Gestión de Pedidos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí podrás gestionar los pedidos
            de tus clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
