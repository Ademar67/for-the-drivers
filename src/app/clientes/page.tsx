
"use client";

import { useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  doc,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { clienteColumns } from './cliente-columns';
import { ClienteForm, ClienteFormValues } from './cliente-form';
import type { Cliente } from '@/lib/firebase-types';
import { useFirestore } from '@/firebase/provider';

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const db = useFirestore() as Firestore;

  const clientesQuery = useMemo(
    () => (db ? query(collection(db, 'clientes'), orderBy('nombre', 'asc')) : null),
    [db]
  );
  const [snapshot, isLoading, error] = useCollection(clientesQuery);

  const clientes = useMemo(
    () => snapshot?.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cliente)) || [],
    [snapshot]
  );
  
  if (error) {
    console.error("Error fetching clientes:", error);
  }

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
      if (selectedCliente) {
        // Update
        const docRef = doc(db, 'clientes', selectedCliente.id);
        await updateDoc(docRef, { ...values, updatedAt: serverTimestamp() });
      } else {
        // Create
        await addDoc(collection(db, 'clientes'), {
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      handleFormClose();
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };

  const handleDeleteCliente = async (clienteId: string) => {
    try {
      await deleteDoc(doc(db, 'clientes', clienteId));
    } catch (error) {
      console.error('Error deleting cliente:', error);
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
            columns={clienteColumns({
              onEdit: handleOpenForm,
              onDelete: handleDeleteCliente,
            })}
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
