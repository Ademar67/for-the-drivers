import { Cotizacion } from '@/lib/firestore/cotizaciones';
import { CotizacionPDF } from './cotizacion-pdf';
import { pdf } from '@react-pdf/renderer';

export async function generarCotizacionPDF(cotizacion: Cotizacion) {
  const blob = await pdf(<CotizacionPDF cotizacion={cotizacion} />).toBlob();
  return blob;
}
