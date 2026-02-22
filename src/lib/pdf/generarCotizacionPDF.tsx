
import { pdf } from '@react-pdf/renderer';
import { CotizacionPDF } from './cotizacion-pdf';
import { Cotizacion } from '@/lib/firestore/cotizaciones';

export async function generarCotizacionPDF(cotizacion: Cotizacion) {
  const blob = await pdf(
    <CotizacionPDF cotizacion={cotizacion} />
  ).toBlob();

  return blob;
}
