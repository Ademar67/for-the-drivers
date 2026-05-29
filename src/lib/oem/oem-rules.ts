export type OEMRule = {
  oem: string;
  compatibleProducts: string[];
  incompatibleTypes?: string[];
  notes?: string;
};

export const OEM_RULES: OEMRule[] = [
  {
    oem: 'Toyota WS',
    compatibleProducts: [
      'Top Tec ATF 1800',
      'ATF WS'
    ],
    incompatibleTypes: [
      'CVT',
      'DSG'
    ],
    notes:
      'Especificación para transmisiones automáticas Toyota/Aisin modernas.'
  },

  {
    oem: 'Dexron VI',
    compatibleProducts: [
      'Top Tec ATF 1800'
    ],
    incompatibleTypes: [
      'CVT'
    ],
    notes:
      'Fluido de baja viscosidad usado en transmisiones GM modernas.'
  },

  {
    oem: 'CVT',
    compatibleProducts: [
      'Top Tec ATF 1400'
    ],
    incompatibleTypes: [
      'DSG',
      'Dexron VI',
      'Toyota WS'
    ],
    notes:
      'Solo para transmisiones CVT.'
  },

  {
    oem: 'DSG',
    compatibleProducts: [
      'Top Tec DSG Fluid'
    ],
    incompatibleTypes: [
      'CVT',
      'Toyota WS'
    ],
    notes:
      'Solo para transmisiones DSG de doble embrague.'
  }
];

