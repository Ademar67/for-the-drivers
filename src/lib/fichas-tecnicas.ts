
export interface FichaTecnica {
  id: string;
  name: string;
  category: 'Aceite' | 'Mantenimiento' | 'Tratamientos';
  url: string;
}

// NOTA: Agrega aquí más fichas técnicas según sea necesario.
// Asegúrate de que los archivos PDF existan en la carpeta /public.
// El formato de la URL es importante, especialmente el uso de %20 para espacios.
export const fichasTecnicas: FichaTecnica[] = [
  // --- ACEITES ---
  {
    id: '1',
    name: 'Leichtlauf HC7 5W-30',
    category: 'Aceite',
    url: '/fichas/Fichas%20Aceite/leichtlauf-hc7-5w-30.pdf',
  },
  {
    id: '2',
    name: 'Top Tec 4200 5W-30',
    category: 'Aceite',
    url: '/fichas/Fichas%20Aceite/top-tec-4200-5w-30.pdf',
  },
  {
    id: '3',
    name: 'Synthoil High Tech 5W-40',
    category: 'Aceite',
    url: '/fichas/Fichas%20Aceite/synthoil-high-tech-5w-40.pdf',
  },
  {
    id: '4',
    name: 'Molygen New Generation 5W-30',
    category: 'Aceite',
    url: '/fichas/Fichas%20Aceite/molygen-new-gen-5w-30.pdf',
  },
  {
    id: '5',
    name: 'Special Tec AA 5W-20',
    category: 'Aceite',
    url: '/fichas/Fichas%20Aceite/special-tec-aa-5w-20.pdf',
  },

  // --- MANTENIMIENTO ---
  {
    id: '6',
    name: 'Limpia Parabrisas Concentrado',
    category: 'Mantenimiento',
    url: '/fichas/Fichas%20Mantenimiento/limpia-parabrisas.pdf',
  },
  {
    id: '7',
    name: 'Anticongelante KFS 12+',
    category: 'Mantenimiento',
    url: '/fichas/Fichas%20Mantenimiento/anticongelante-kfs-12.pdf',
  },
  {
    id: '8',
    name: 'Grasa Multiuso',
    category: 'Mantenimiento',
    url: '/fichas/Fichas%20Mantenimiento/grasa-multiuso.pdf',
  },
  {
    id: '9',
    name: 'Líquido de Frenos DOT 4',
    category: 'Mantenimiento',
    url: '/fichas/Fichas%20Mantenimiento/liquido-frenos-dot4.pdf',
  },
  {
    id: '10',
    name: 'Silicona en Spray',
    category: 'Mantenimiento',
    url: '/fichas/Fichas%20Mantenimiento/silicona-spray.pdf',
  },

  // --- TRATAMIENTOS ---
  {
    id: '11',
    name: 'Ceratec',
    category: 'Tratamientos',
    url: '/fichas/Fichas%20Tratamientos/ceratec.pdf',
  },
  {
    id: '12',
    name: 'Engine Flush',
    category: 'Tratamientos',
    url: '/fichas/Fichas%20Tratamientos/engine-flush.pdf',
  },
  {
    id: '13',
    name: 'Injection Reiniger',
    category: 'Tratamientos',
    url: '/fichas/Fichas%20Tratamientos/injection-reiniger.pdf',
  },
  {
    id: '14',
    name: 'Oil Additiv',
    category: 'Tratamientos',
    url: '/fichas/Fichas%20Tratamientos/oil-additiv.pdf',
  },
  {
    id: '15',
    name: 'Hydro Stossel Additiv',
    category: 'Tratamientos',
    url: '/fichas/Fichas%20Tratamientos/hydro-stossel-additiv.pdf',
  },
];
