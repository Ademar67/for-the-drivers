'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClienteFS } from '@/lib/firestore/clientes';

interface CrearFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    folio: string;
    clienteId: string;
    clienteNombre?: string;
    monto: number;
    fecha: string;
    fechaVencimiento: string;
    pedidoId?: string;
  }) => Promise<void>;
  clientes: ClienteFS[];
}

export default function CrearFacturaModal({
  isOpen,
  onClose,
  onSave,
  clientes,
}: CrearFacturaModalProps) {
  const [folio, setFolio] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');

  const resetForm = () => {
    setFolio('');
    setClienteId('');
    setMonto('');
    setFecha('');
    setFechaVencimiento('');
    setPedidoId('');
    setFiltroCliente('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folio.trim() || !clienteId || !monto || !fecha || !fechaVencimiento) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const montoNumerico = Number(monto);

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      alert('Escribe un monto válido mayor a 0.');
      return;
    }

    if (new Date(fechaVencimiento) < new Date(fecha)) {
      alert('La fecha de vencimiento no puede ser menor que la fecha de emisión.');
      return;
    }

    setLoading(true);

    const clienteSeleccionado = clientes.find((c) => c.id === clienteId);

    try {
      await onSave({
        folio: folio.trim(),
        clienteId,
        clienteNombre: clienteSeleccionado?.nombre,
        monto: montoNumerico,
        fecha,
        fechaVencimiento,
        pedidoId: pedidoId.trim() || 'N/A',
      });

      resetForm();
    } catch (error) {
      console.error('Error al guardar la factura:', error);
      alert('No se pudo guardar la factura.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const clientesFiltrados = useMemo(() => {
    const termino = filtroCliente.trim().toLowerCase();

    if (!termino) {
      return clientes;
    }

    return clientes.filter((cliente) =>
      String(cliente.nombre ?? '').toLowerCase().includes(termino)
    );
  }, [clientes, filtroCliente]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                required
              />
            </div>

            {clientes.length > 30 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="filtro-cliente" className="text-right">
                  Filtrar
                </Label>
                <Input
                  id="filtro-cliente"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="col-span-3"
                  placeholder="Filtrar cliente..."
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">
                Cliente
              </Label>
              <select
                id="cliente"
                name="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="col-span-3 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Selecciona un cliente
                </option>
                {clientesFiltrados.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="text-right">
                Monto
              </Label>
              <Input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="col-span-3"
                placeholder="1000.00"
                required
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
                required
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
                required
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
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
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