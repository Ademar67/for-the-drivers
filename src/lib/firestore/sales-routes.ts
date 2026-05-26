import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export async function guardarRutaDenue(routeItems: any[]) {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (!routeItems.length) {
    throw new Error('No hay negocios para guardar');
  }

  const payload = {
    ownerId: auth.currentUser.uid,
    ownerEmail: auth.currentUser.email ?? '',

    createdAt: serverTimestamp(),

    status: 'draft',

    totalStops: routeItems.length,

    routeItems,
  };

  const docRef = await addDoc(
    collection(db, 'sales_routes'),
    payload
  );

  return docRef.id;
}