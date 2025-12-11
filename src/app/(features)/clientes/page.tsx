'use client';
import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase, useFirestore } from '@/firebase/provider';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ClienteForm, type Cliente } from './cliente-form';
import { deleteDocumentNonBlocking } from '@/firebase';

export default function ClientesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const firestore = useFirestore();

  const clientesCollection = useMemoFirebase(
    () => collection(firestore, 'clientes'),
    [firestore]
  );
  const { data: clientes, isLoading } = useCollection<Cliente>(clientesCollection);

  const handleAdd = () => {
    setSelectedCliente(null);
    setDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDialogOpen(true);
  };

  const handleDelete = async (clienteId: string) => {
    if (!firestore) return;
    const clienteDoc = doc(firestore, 'clientes', clienteId);
    try {
      await deleteDoc(clienteDoc);
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado correctamente.',
      });
    } catch (error) {
      console.error('Error deleting client: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el cliente. Inténtalo de nuevo.',
      });
    }
  };

  const handleDeleteWithConfirmation = (cliente: Cliente) => {
    if (!cliente.id) return;
    const clienteDoc = doc(firestore, 'clientes', cliente.id);
    deleteDocumentNonBlocking(clienteDoc);
    toast({
      title: 'Cliente eliminado',
      description: `El cliente "${cliente.nombre}" ha sido eliminado.`,
    });
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Users className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Gestión de Clientes</h1>
          </div>
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Cliente
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Cargando clientes...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>NIT</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes?.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>{cliente.nombre}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefono}</TableCell>
                      <TableCell>{cliente.direccion}</TableCell>
                      <TableCell>{cliente.nit}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWithConfirmation(cliente)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <ClienteForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleFormSuccess}
        cliente={selectedCliente}
      />
    </>
  );
}
