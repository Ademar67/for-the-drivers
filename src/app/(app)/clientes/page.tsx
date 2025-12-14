
"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, PlusCircle } from "lucide-react";
import { collection, getDocs, orderBy, query, doc, serverTimestamp, deleteDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ClienteForm, type ClienteFormValues } from "./cliente-form";
import { clienteColumns } from "./cliente-columns";
import type { Cliente } from "@/lib/firebase-types";

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
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
  }, []);

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

  const handleSaveCliente = async (values: ClienteFormValues) => {
    try {
      const docRef = selectedCliente
        ? doc(db, "clientes", selectedCliente.id)
        : doc(collection(db, "clientes"));

      const dataToSave: Omit<Cliente, 'createdAt' | 'updatedAt'> & { createdAt?: any, updatedAt: any } = {
        ...values,
        id: docRef.id,
        updatedAt: serverTimestamp(),
      };
      
      if (!selectedCliente) {
        dataToSave.createdAt = serverTimestamp();
      }
      
      await setDoc(docRef, dataToSave, { merge: true });

      handleFormClose();
      fetchClientes();
    } catch (error) {
      console.error("Error saving document: ", error);
    }
  };
  
  const handleDeleteCliente = async (clienteId: string) => {
    try {
      await deleteDoc(doc(db, "clientes", clienteId));
      fetchClientes();
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
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
