
export type VehicleRule = {
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  transmissionType: string;
  transmissionCode?: string;
  oemSpecs: string[];
  drivetrain?: string;
  notes?: string;
};

export const VEHICLE_RULES: VehicleRule[] = [
  {
    brand: "Toyota",
    model: "RAV4",
    yearFrom: 2013,
    yearTo: 2018,
    transmissionType: "Automatic",
    transmissionCode: "U760E",
    oemSpecs: ["Toyota WS"],
    drivetrain: "FWD/AWD",
    notes: "Transmisión automática Aisin de 6 velocidades.",
  },

  {
    brand: "Volkswagen",
    model: "Golf GTI",
    yearFrom: 2015,
    yearTo: 2021,
    transmissionType: "DSG",
    transmissionCode: "DQ381",
    oemSpecs: ["DSG"],
    drivetrain: "FWD",
    notes: "DSG de doble embrague húmedo.",
  },

  {
    brand: "Nissan",
    model: "Sentra",
    yearFrom: 2013,
    yearTo: 2020,
    transmissionType: "CVT",
    oemSpecs: ["CVT"],
    drivetrain: "FWD",
    notes: "CVT tipo Xtronic.",
  },
  {
    brand: "Chevrolet",
    model: "Sonic",
    yearFrom: 2012,
    yearTo: 2020,
    transmissionType: "Automatic",
    oemSpecs: ["Dexron VI"],
    drivetrain: "FWD",
    notes:
      "Transmisión automática GM de 6 velocidades compatible con Dexron VI.",
  },

  {
    brand: "Audi",
    model: "A3",
    yearFrom: 2015,
    yearTo: 2020,
    transmissionType: "DSG",
    transmissionCode: "DQ250",
    oemSpecs: ["DSG"],
    drivetrain: "Quattro/FWD",
    notes: "DSG húmeda de 6 velocidades.",
  },
];

