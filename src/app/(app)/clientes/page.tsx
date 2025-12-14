
"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, PlusCircle } from "lucide-react";
import { collection, getDocs, orderBy, query, doc, serverTimestamp, Firestore } from "firebase/firestore";

import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ClienteForm, type ClienteFormValues } from "./cliente-form";
import { clienteColumns } from "./cliente-columns";
import type { Cliente } from "@/lib/firebase-types";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const db = useFirestore() as Firestore;

  const fetchClientes = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const clientesRef = collection(db, "clientes");
      const q = query(clientesRef, orderBy("nombre", "asc"));
      const querySnapshot = await getDocs(q);
      const clientesList = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Cliente)
      );
      setClientes(clientesList);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleOpenForm = (cliente?: Cliente) => {
    setSelectedCliente(cliente || null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCliente(null);
  };

  const handleSaveCliente = (values: ClienteFormValues) => {
    const docRef = selectedCliente
      ? doc(db, "clientes", selectedCliente.id)
      : doc(collection(db, "clientes"));

    const dataToSave: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: any, updatedAt: any } = {
      ...values,
      updatedAt: serverTimestamp(),
    };
    
    if (!selectedCliente) {
      dataToSave.createdAt = serverTimestamp();
    }
    
    setDocumentNonBlocking(docRef, dataToSave, { merge: true });

    handleFormClose();
    // Optimistically update UI or refetch
    setTimeout(fetchClientes, 500); // Refetch after a short delay
  };
  
  const handleDeleteCliente = (clienteId: string) => {
    const docRef = doc(db, "clientes", clienteId);
    deleteDocumentNonBlocking(docRef);
    // Optimistically update UI or refetch
    setTimeout(fetchClientes, 500); // Refetch after a short delay
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
            columns={clienteColumns({ onEdit: handleOpenForm, onDelete: handleDeleteCliente })}
            data={clientes}
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
        onSuccess={handleSaveCliente}
      />
    </div>
  );
}
