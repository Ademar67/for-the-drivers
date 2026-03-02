import { pdf } from '@react-pdf/renderer';
import { CotizacionPDF } from './cotizacion-pdf';
import { CotizacionPDFData } from './types';

export async function generarCotizacionPDF(data: CotizacionPDFData) {
  const blob = await pdf(<CotizacionPDF data={data} />).toBlob();

  return blob;
}
