import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function MapaClientesPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Map className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Mapa de Clientes</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí podrás visualizar la ubicación
            de tus clientes en un mapa interactivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
