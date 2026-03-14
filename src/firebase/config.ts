import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAiJVQpMsz59e3cYXas1qc6cl14jTatVI",
  authDomain: "studio-1380428146-f0274.firebaseapp.com",
  projectId: "studio-1380428146-f0274",
  storageBucket: "studio-1380428146-f0274.firebasestorage.app",
  messagingSenderId: "423714082526",
  appId: "1:423714082526:web:08da2ff40352605634fc4f",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;