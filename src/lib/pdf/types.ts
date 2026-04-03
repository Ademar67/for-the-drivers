export interface CotizacionPDFItem {
  nombre: string;
  codigo?: string;
  cantidad: number;
  precio: number;
  subtotal?: number;
  total: number;
  descuentos?: Array<number | undefined>;
}

export interface CotizacionPDFData {
  cliente: string;
  fecha: string;
  asesor?: string;
  subtotal: number;
  descuentos: number;
  total: number;
  observaciones?: string;
  vigenciaDias?: number;
  items: CotizacionPDFItem[];
}