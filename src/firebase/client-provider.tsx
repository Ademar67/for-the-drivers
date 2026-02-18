'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/core-provider';
import { app, auth, db } from '@/lib/firebase'; // Import the single instance

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The app is already initialized in @/lib/firebase
  // We just need to pass it to the provider
  return (
    <FirebaseProvider
      firebaseApp={app}
      auth={auth}
      firestore={db}
    >
      {children}
    </FirebaseProvider>
  );
}
