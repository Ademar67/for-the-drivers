import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";

export type PropuestaAgenciaItem = {
  nombre: string;
  paquetesMes: number;
  costoUnitario: number;
  precioUnitario: number;
  costoMensual: number;
  ventaMensual: number;
  utilidadMensualBruta: number;
  comisionMensual: number;
  utilidadMensualNeta: number;
};

export type PropuestaAgencia = {
  id?: string;
  agenciaId: string;
  agenciaNombre: string;
  nombrePropuesta: string;
  items: PropuestaAgenciaItem[];
  paquetesTotalesMes: number;
  costoMensual: number;
  ventaMensual: number;
  utilidadMensualBruta: number;
  utilidadMensualAgencia: number;
  comisionMensualAsesor: number;
  margenBrutoPct: number;
  ticketPromedio: number;
  createdAt?: any;
};

export async function crearPropuestaAgencia(
  payload: Omit<PropuestaAgencia, "id" | "createdAt">
) {
  const ref = await addDoc(collection(db, "propuestas_agencias"), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function obtenerPropuestasPorAgencia(agenciaId: string) {
  const q = query(
    collection(db, "propuestas_agencias"),
    where("agenciaId", "==", agenciaId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as PropuestaAgencia[];
}