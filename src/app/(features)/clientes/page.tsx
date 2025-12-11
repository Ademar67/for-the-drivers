import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ClientesPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Users className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Gestión de Clientes</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo. Aquí podrás gestionar toda la
            información de tus clientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
