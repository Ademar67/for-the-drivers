"use client";

import { useState } from "react";
import { Users, PlusCircle } from "lucide-react";
import { collection, orderBy, query } from "firebase/firestore";

import { useFirestore, useCollection } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ClienteForm } from "./cliente-form";
import { clienteColumns } from "./cliente-columns";
import type { Cliente } from "@/lib/firebase-types";

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const db = useFirestore();
  const clientesQuery = query(collection(db, "clientes"), orderBy("nombre", "asc"));
  const { data: clientes, isLoading } = useCollection<Cliente>(clientesQuery);

  const handleOpenForm = (cliente?: Cliente) => {
    setSelectedCliente(cliente || null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCliente(null);
  };

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* CUSTOMER TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={clienteColumns({ onEdit: handleOpenForm })}
            data={clientes || []}
            isLoading={isLoading}
            filterColumnId="nombre"
            filterPlaceholder="Filtrar por nombre..."
          />
        </CardContent>
      </Card>

      {/* DIALOG FORM */}
      <ClienteForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        cliente={selectedCliente}
        onSuccess={handleFormClose}
      />
    </div>
  );
}
