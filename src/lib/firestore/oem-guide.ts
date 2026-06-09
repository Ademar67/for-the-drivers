import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

import { db } from "@/firebase/config";

export interface OEMGuideEntry {
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  transmissionType: string;
  oemSpec: string;
  recommendedProduct: string;
}

const COLLECTION = "oem_guide";

export async function findOEMGuide(brand: string, model: string, year: number) {
  const snapshot = await getDocs(collection(db, COLLECTION));

  const rows = snapshot.docs.map((doc) => doc.data() as OEMGuideEntry);

  return rows.find(
    (r) =>
      r.brand === brand &&
      r.model === model &&
      year >= r.yearFrom &&
      year <= r.yearTo
  );
}

export async function addOEMGuide(data: OEMGuideEntry) {
  return addDoc(collection(db, COLLECTION), data);
}
