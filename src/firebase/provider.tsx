'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Define the shape of the context state
interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

// Create the context with a default null value
const FirebaseContext = createContext<FirebaseContextState | null>(null);

// Define the props for the provider component
interface FirebaseProviderProps extends FirebaseContextState {
  children: ReactNode;
}

/**
 * Provider component that makes Firebase services available to the component tree.
 */
export function FirebaseProvider({
  firebaseApp,
  auth,
  firestore,
  children,
}: FirebaseProviderProps) {
  const value = { firebaseApp, auth, firestore };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

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
