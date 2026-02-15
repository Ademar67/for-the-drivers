export type MaterialCategory =
  | "LISTA_PRECIOS"
  | "TRIPTICO"
  | "CATALOGO"
  | "PROMO"
  | "OTRO";

export type MaterialItem = {
  id: string;
  title: string;
  category: MaterialCategory;
  file: string; // ruta dentro de /public
  description?: string;
  tags?: string[];
  isActive?: boolean;
};

export const MATERIALES: MaterialItem[] = [
  // LISTAS DE PRECIOS
  {
    id: "lista-precios",
    title: "Lista de Precios",
    category: "LISTA_PRECIOS",
    file: "/materiales/listas-precios/LISTA_DE_PRECIOS.pdf",
    description: "Lista oficial de precios actualizada.",
    tags: ["precios", "lista"],
    isActive: true,
  },
  {
    id: "lista-precios-motos",
    title: "Lista de Precios Motos",
    category: "LISTA_PRECIOS",
    file: "/materiales/listas-precios/LISTA_DE_PRECIOS_MOTOS.pdf",
    description: "Lista de precios para línea motos.",
    tags: ["precios", "motos", "lista"],
    isActive: true,
  },

  // TRÍPTICOS
  {
    id: "triptico-aceites",
    title: "Tríptico Línea de Aceites",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-aceites.pdf",
    description: "Tríptico con información de la línea de aceites.",
    tags: ["triptico", "aceites"],
    isActive: true,
  },
  {
    id: "triptico-estetica",
    title: "Tríptico Performance / Estética",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-estetica.pdf",
    description: "Tríptico con productos para cuidado y estética del vehículo.",
    tags: ["triptico", "estetica", "performance"],
    isActive: true,
  },
  {
    id: "triptico-mantenimiento",
    title: "Tríptico Productos para Mantenimiento",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-mantenimiento.pdf",
    description: "Tríptico de productos de mantenimiento y limpieza.",
    tags: ["triptico", "mantenimiento", "limpieza"],
    isActive: true,
  },
  {
    id: "triptico-tratamientos",
    title: "Tríptico Línea de Tratamientos",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-tratamientos.pdf",
    description: "Tríptico con tratamientos para gasolina, diésel, refrigeración y aceite.",
    tags: ["triptico", "tratamientos", "gasolina", "diesel"],
    isActive: true,
  },
  {
    id: "triptico-bicicletas",
    title: "Tríptico Productos para Bicicletas",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-bicicletas.pdf",
    description: "Tríptico con productos Liqui Moly para bicicletas.",
    tags: ["triptico", "bicicletas", "bike"],
    isActive: true,
  },
  {
    id: "triptico-motos",
    title: "Tríptico Productos para Motocicletas",
    category: "TRIPTICO",
    file: "/materiales/tripticos/triptico-motos.pdf",
    description: "Tríptico con productos Liqui Moly para motocicletas.",
    tags: ["triptico", "motos", "motorbike"],
    isActive: true,
  },

  // PROMOS
  {
    id: "promo-febrero",
    title: "Promociones Febrero",
    category: "PROMO",
    file: "/materiales/promos/promo-febrero.pdf",
    description: "Promociones y ofertas especiales del mes.",
    tags: ["promo", "febrero", "ofertas"],
    isActive: true,
  },

  // CATÁLOGOS
  {
    id: "catalogo-general",
    title: "Catálogo General Liqui Moly",
    category: "CATALOGO",
    file: "/materiales/catalogos/catalogo-general.pdf",
    description: "Catálogo general de productos.",
    tags: ["catalogo", "productos"],
    isActive: true,
  },

  // OTROS
  {
    id: "fichas-tecnicas-mg",
    title: "Fichas Técnicas MG",
    category: "OTRO",
    file: "/materiales/otros/fichas-tecnicas-mg.pdf",
    description: "Fichas técnicas / homologaciones para MG.",
    tags: ["fichas", "mg", "homologacion"],
    isActive: true,
  },
  {
    id: "fichas-tecnicas-vw",
    title: "Fichas Técnicas Volkswagen",
    category: "OTRO",
    file: "/materiales/otros/fichas-tecnicas-vw.pdf",
    description: "Fichas técnicas / homologaciones para Volkswagen.",
    tags: ["fichas", "vw", "volkswagen", "homologacion"],
    isActive: true,
  },
];