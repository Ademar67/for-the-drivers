import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type VisitaTipo = "visita" | "cotizacion" | "cobranza" | "seguimiento";
export type VisitaEstado = "pendiente" | "realizada";

export type Visita = {
  id?: string;
  ownerId?: string;
  ownerEmail?: string;
  clienteId: string;
  cliente: string;
  fecha: string;
  hora: string;
  tipo: VisitaTipo;
  notas?: string;
  estado: VisitaEstado;
  createdAt?: any;
  updatedAt?: any;
  fechaRealizada?: any;
};

function getCurrentUserOrThrow() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  return user;
}

export async function crearVisita(visita: Omit<Visita, "id" | "ownerId" | "ownerEmail">) {
  const user = getCurrentUserOrThrow();

  await addDoc(collection(db, "visitas"), {
    ...visita,
    ownerId: user.uid,
    ownerEmail: user.email ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenVisitas(setVisitas: (visitas: Visita[]) => void) {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, "visitas"),
    where("ownerId", "==", user.uid),
    orderBy("fecha", "desc")
  );

  return onSnapshot(q, (snap) => {
    const data: Visita[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Visita, "id">),
    }));
    setVisitas(data);
  });
}

export async function obtenerVisitas() {
  const user = getCurrentUserOrThrow();

  const q = query(
    collection(db, "visitas"),
    where("ownerId", "==", user.uid),
    orderBy("fecha", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Visita, "id">),
  })) as Visita[];
}

export async function eliminarVisita(id?: string) {
  getCurrentUserOrThrow();

  if (!id) throw new Error("Se requiere un ID de visita para eliminarla.");
  await deleteDoc(doc(db, "visitas", id));
}

export async function marcarVisitaRealizada(id: string, nota?: string) {
  getCurrentUserOrThrow();

  if (!id) throw new Error("Se requiere un ID de visita para marcarla.");
  await updateDoc(doc(db, "visitas", id), {
    estado: "realizada",
    notas: nota ?? "",
    fechaRealizada: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}