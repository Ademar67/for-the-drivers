"use client";

import { Users, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClientesPage() {
  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>

        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* CONTENIDO */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de clientes</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">
            Aquí se mostrará el listado de clientes registrados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}