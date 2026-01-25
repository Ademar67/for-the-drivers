
/**
 * @deprecated This file is no longer in use.
 * The technical sheets are now loaded dynamically via the API route at /api/fichas-tecnicas.
 * This file is kept for reference and will be removed in a future update.
 */
export interface FichaTecnica {
  id: string;
  name: string;
  category: 'Aceite' | 'Mantenimiento' | 'Tratamientos';
  url: string;
}

export const fichasTecnicas: FichaTecnica[] = [];
