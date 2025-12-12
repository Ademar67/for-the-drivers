// src/lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAAiJVQpMsz59e3cYXas1qc6cl14jTatVI",
  authDomain: "studio-1380428146-f0274.firebaseapp.com",
  projectId: "studio-1380428146-f0274",
  storageBucket: "studio-1380428146-f0274.firebasestorage.app",
  messagingSenderId: "423714082526",
  appId: "1:423714082526:web:08da2ff40352605634fc4f",
};

// Inicializar app sin duplicados
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);