import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type VisitaTipo = "visita" | "cotizacion" | "cobranza" | "seguimiento";
export type VisitaEstado = "pendiente" | "realizada";

export type Visita = {
  id?: string;
  clienteId: string;
  cliente: string;

  // Nota: en tu UI "fecha" la tratas como string YYYY-MM-DD
  fecha: string;
  hora: string;

  tipo: VisitaTipo;
  notas?: string;

  estado: VisitaEstado;

  createdAt?: any;
  updatedAt?: any;

  fechaRealizada?: any;
};

export async function crearVisita(visita: Omit<Visita, "id">) {
  await addDoc(collection(db, "visitas"), {
    ...visita,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenVisitas(setVisitas: (visitas: Visita[]) => void) {
  const q = query(collection(db, "visitas"), orderBy("fecha", "desc"));

  return onSnapshot(q, (snap) => {
    const data: Visita[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Visita, "id">),
    }));
    setVisitas(data);
  });
}

export async function obtenerVisitas() {
  const q = query(collection(db, "visitas"), orderBy("fecha", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Visita, "id">),
  })) as Visita[];
}

export async function eliminarVisita(id?: string) {
  if (!id) throw new Error("Se requiere un ID de visita para eliminarla.");
  await deleteDoc(doc(db, "visitas", id));
}

export async function marcarVisitaRealizada(id: string, nota?: string) {
  if (!id) throw new Error("Se requiere un ID de visita para marcarla.");
  await updateDoc(doc(db, "visitas", id), {
    estado: "realizada",
    notas: nota ?? "",
    fechaRealizada: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
