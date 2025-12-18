'use client';

import { useContext } from 'react';
import { FirebaseContext } from './core-provider';

/**
 * Custom hook to access the entire Firebase context.
 * Throws an error if used outside of a FirebaseProvider.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

/**
 * Custom hook to access the Firebase App instance.
 */
export function useFirebaseApp() {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
}

/**
 * Custom hook to access the Firebase Auth instance.
 */
export function useAuth() {
  const { auth } = useFirebase();
  return auth;
}

/**
 * Custom hook to access the Firestore instance.
 */
export function useFirestore() {
  const { firestore } = useFirebase();
  return firestore;
}
