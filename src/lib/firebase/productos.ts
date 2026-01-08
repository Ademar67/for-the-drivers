import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function obtenerProductosFirestore() {
  const snap = await getDocs(collection(db, 'productos'));

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
