'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { toast } from '@/hooks/use-toast';

const clienteSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido.' }),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  nit: z.string().optional(),
});

export type Cliente = z.infer<typeof clienteSchema> & { id?: string };

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cliente: Cliente | null;
}

export function ClienteForm({ open, onOpenChange, onSuccess, cliente }: ClienteFormProps) {
  const firestore = useFirestore();

  const form = useForm<Cliente>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      nit: '',
    },
  });

  useEffect(() => {
    if (cliente) {
      form.reset(cliente);
    } else {
      form.reset({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        nit: '',
      });
    }
  }, [cliente, form, open]);

  const onSubmit = async (data: Cliente) => {
    if (!firestore) return;

    try {
      if (cliente && cliente.id) {
        // Update existing client
        const clienteDoc = doc(firestore, 'clientes', cliente.id);
        setDocumentNonBlocking(clienteDoc, { ...data, updatedAt: serverTimestamp() }, { merge: true });
        toast({
          title: 'Cliente actualizado',
          description: 'La información del cliente ha sido actualizada.',
        });
      } else {
        // Add new client
        const clientesCollection = collection(firestore, 'clientes');
        addDocumentNonBlocking(clientesCollection, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Cliente añadido',
          description: 'El nuevo cliente ha sido añadido correctamente.',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving client: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el cliente. Inténtalo de nuevo.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT</FormLabel>
                  <FormControl>
                    <Input placeholder="NIT del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
