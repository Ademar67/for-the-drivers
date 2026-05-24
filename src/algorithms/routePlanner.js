// src/algorithms/routePlanner.js

const LOCAL_DISTANCE_KM = 120;
const MAX_VISITS_PER_DAY = 8;

const DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes"
];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Morelia como base
const BASE_LAT = 19.7008;
const BASE_LNG = -101.1844;

function isForaneo(cliente) {
  if (!cliente.lat || !cliente.lng) return false;

  const distance = calculateDistance(
    BASE_LAT,
    BASE_LNG,
    cliente.lat,
    cliente.lng
  );

  return distance > LOCAL_DISTANCE_KM;
}

function groupByCity(clientes) {
  const grouped = {};

  clientes.forEach((cliente) => {
    // usar ciudad si existe
    // si no, usar TODOS juntos
    const city =
      cliente.ciudad &&
      cliente.ciudad !== 'undefined' &&
      cliente.ciudad !== 'null'
        ? cliente.ciudad
        : 'GENERAL';

    if (!grouped[city]) {
      grouped[city] = [];
    }

    grouped[city].push(cliente);
  });

  return grouped;
}
// Agrupar clientes cercanos
function createGeoClusters(clientes, maxDistanceKm = 25) {
  const clusters = [];
  const used = new Set();

  clientes.forEach((cliente, index) => {
    if (used.has(index)) return;

    const cluster = [cliente];
    used.add(index);

    clientes.forEach((otroCliente, otherIndex) => {
      if (used.has(otherIndex)) return;

      const distance = calculateDistance(
        cliente.lat,
        cliente.lng,
        otroCliente.lat,
        otroCliente.lng
      );

      if (distance <= maxDistanceKm) {
        cluster.push(otroCliente);
        used.add(otherIndex);
      }
    });

    clusters.push(cluster);
  });

  return clusters;
}
function chunkArray(array, size) {
  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

export function generateMonthlyPlan(clientes) {
  const locales = [];
  const foraneos = [];

  clientes.forEach((cliente) => {
    if (isForaneo(cliente)) {
      foraneos.push(cliente);
    } else {
      locales.push(cliente);
    }
  });

  const groupedLocales = groupByCity(locales);
  const groupedForaneos = groupByCity(foraneos);

  const semanas = {
    semana1: {},
    semana2: {},
    semana3: {},
    semana4: {},
  };

  DAYS.forEach((day) => {
    semanas.semana1[day] = [];
    semanas.semana2[day] = [];
    semanas.semana3[day] = [];
    semanas.semana4[day] = [];
  });

  // =========================
  // FORÁNEOS
  // =========================

  let foraneoDaysWeek1 = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
  ];

  let foraneoDaysWeek4 = [
    "martes",
    "miercoles",
    "jueves",
  ];

  let currentDayIndex = 0;

  Object.values(groupedForaneos).forEach((group) => {
    const geoClusters = createGeoClusters(group, 40);
  
    geoClusters.forEach((cluster) => {
      const chunks = chunkArray(
        cluster,
        MAX_VISITS_PER_DAY
      );
  
      chunks.forEach((chunk) => {
        if (currentDayIndex < foraneoDaysWeek1.length) {
          const day =
            foraneoDaysWeek1[currentDayIndex];
  
          semanas.semana1[day].push(...chunk);
        } else {
          const week4Index =
            currentDayIndex -
            foraneoDaysWeek1.length;
  
          if (week4Index < foraneoDaysWeek4.length) {
            const day =
              foraneoDaysWeek4[week4Index];
  
            semanas.semana4[day].push(...chunk);
          }
        }
  
        currentDayIndex++;
      });
    });
  });
  


  // =========================
  // LOCALES
  // =========================

  const localChunks = [];

Object.values(groupedLocales).forEach((group) => {
  const geoClusters = createGeoClusters(group);

  geoClusters.forEach((cluster) => {
    const chunks = chunkArray(
      cluster,
      MAX_VISITS_PER_DAY
    );

    localChunks.push(...chunks);
  });
});

  let localIndex = 0;

  ["semana2", "semana3"].forEach((semana) => {
    DAYS.forEach((day) => {
      if (localChunks[localIndex]) {
        semanas[semana][day] = localChunks[localIndex];
        localIndex++;
      }
    });
  });

  return semanas;
}