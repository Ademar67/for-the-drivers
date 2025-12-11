import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';

export default function ProductosPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <ShoppingBag className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">
          Catálogo de Productos
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí podrás administrar el catálogo
            de productos de Liqui Moly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
