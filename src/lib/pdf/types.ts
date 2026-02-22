
export interface CotizacionPDFData {
  id: string;
  fecha_creacion?: {
    seconds: number;
    nanoseconds: number;
  };
  clienteNombre: string;
  clienteDireccion?: string;
  items: {
    codigo: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }[];
  subtotal: number;
  totalDescuentos: number;
  total: number;
  observaciones?: string;
  vigenciaDias?: number;
}
