'use client';

import React, { createContext, type ReactNode } from 'react';
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
export const FirebaseContext = createContext<FirebaseContextState | null>(null);

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
