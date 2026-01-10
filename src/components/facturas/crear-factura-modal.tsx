
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClienteFS } from '@/lib/firestore/clientes';

interface CrearFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  clientes: ClienteFS[];
}

export default function CrearFacturaModal({ isOpen, onClose, onSave, clientes }: CrearFacturaModalProps) {
  const [folio, setFolio] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || !clienteId || !monto || !fecha || !fechaVencimiento) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }
    setLoading(true);
    const clienteSeleccionado = clientes.find(c => c.id === clienteId);
    
    await onSave({
      folio,
      clienteId,
      clienteNombre: clienteSeleccionado?.nombre,
      monto: parseFloat(monto),
      fecha,
      fechaVencimiento,
      pedidoId: pedidoId || 'N/A', // Opcional
    });
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folio" className="text-right">
                Folio
              </Label>
              <Input
                id="folio"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="col-span-3"
                placeholder="Ej: F-001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">
                Cliente
              </Label>
              <Select onValueChange={setClienteId} value={clienteId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes
                    .filter(cliente => cliente.id)
                    .map(cliente => (
                      <SelectItem key={cliente.id!} value={cliente.id!}>
                        {cliente.nombre}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">
                Monto
              </Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="col-span-3"
                placeholder="1000.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha" className="text-right">
                Fecha Emisión
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaVencimiento" className="text-right">
                Vencimiento
              </Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pedidoId" className="text-right">
                Pedido (ID)
              </Label>
              <Input
                id="pedidoId"
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="col-span-3"
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
