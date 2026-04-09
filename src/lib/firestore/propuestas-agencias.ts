import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

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
  ownerId?: string;
  ownerEmail?: string;
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
  updatedAt?: any;
};

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  return user;
}

export async function crearPropuestaAgencia(
  payload: Omit<
    PropuestaAgencia,
    "id" | "ownerId" | "ownerEmail" | "createdAt" | "updatedAt"
  >
) {
  const user = getCurrentUserOrThrow();

  const ref = await addDoc(collection(db, "propuestas_agencias"), {
    ownerId: user.uid,
    ownerEmail: user.email ?? "",
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function obtenerPropuestasPorAgencia(agenciaId: string) {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, "propuestas_agencias"),
    where("ownerId", "==", user.uid),
    where("agenciaId", "==", agenciaId)
  );

  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<PropuestaAgencia, "id">),
  })) as PropuestaAgencia[];

  data.sort((a, b) => {
    const aTime =
      typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
    const bTime =
      typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;

    return bTime - aTime;
  });

  return data;
}