export type StoreChain = "AutoZone" | "OReilly" | "Liverpool";

export interface StoreItem {
  id: string;
  chain: StoreChain;
  name: string;
  state: string;
  city: string;
}

export const stores: StoreItem[] = [
  // AutoZone Michoacán
  {
    id: "autozone-morelia-la-huerta",
    chain: "AutoZone",
    name: "Morelia La Huerta",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-morelia-madero",
    chain: "AutoZone",
    name: "Morelia Madero",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-morelia-tecnologico",
    chain: "AutoZone",
    name: "Morelia Tecnologico",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-morelia-ventura-puente",
    chain: "AutoZone",
    name: "Morelia Ventura Puente",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-morelia-nocupetaro",
    chain: "AutoZone",
    name: "Morelia Nocupétaro",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-morelia-el-jamal",
    chain: "AutoZone",
    name: "Morelia El Jamal",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "autozone-apatzingan",
    chain: "AutoZone",
    name: "Apatzingán",
    state: "Michoacán",
    city: "Apatzingán",
  },
  {
    id: "autozone-los-reyes",
    chain: "AutoZone",
    name: "Los Reyes",
    state: "Michoacán",
    city: "Los Reyes",
  },
  {
    id: "autozone-zamora-madero",
    chain: "AutoZone",
    name: "Zamora Madero",
    state: "Michoacán",
    city: "Zamora",
  },
  {
    id: "autozone-zamora-lopez-mateos",
    chain: "AutoZone",
    name: "Zamora Lopez Mateos",
    state: "Michoacán",
    city: "Zamora",
  },
  {
    id: "autozone-sahuayo",
    chain: "AutoZone",
    name: "Sahuayo",
    state: "Michoacán",
    city: "Sahuayo",
  },
  {
    id: "autozone-la-piedad",
    chain: "AutoZone",
    name: "La Piedad",
    state: "Michoacán",
    city: "La Piedad",
  },
  {
    id: "autozone-zacapu",
    chain: "AutoZone",
    name: "Zacapu",
    state: "Michoacán",
    city: "Zacapu",
  },

  // OReilly Michoacán
  {
    id: "oreilly-morelia-centro",
    chain: "OReilly",
    name: "Morelia Centro",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "oreilly-morelia-altozano",
    chain: "OReilly",
    name: "Morelia Altozano",
    state: "Michoacán",
    city: "Morelia",
  },
  {
    id: "oreilly-zacapu",
    chain: "OReilly",
    name: "Zacapu",
    state: "Michoacán",
    city: "Zacapu",
  },
  {
    id: "oreilly-jacona",
    chain: "OReilly",
    name: "Jacona",
    state: "Michoacán",
    city: "Jacona",
  },
  {
    id: "oreilly-jiquilpan",
    chain: "OReilly",
    name: "Jiquilpan",
    state: "Michoacán",
    city: "Jiquilpan",
  },
  {
    id: "oreilly-la-piedad",
    chain: "OReilly",
    name: "La Piedad",
    state: "Michoacán",
    city: "La Piedad",
  },

  // Liverpool Michoacán
  {
    id: "liverpool-zamora",
    chain: "Liverpool",
    name: "Zamora",
    state: "Michoacán",
    city: "Zamora",
  },
];