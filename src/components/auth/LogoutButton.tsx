"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className="rounded-xl border px-3 py-2 text-sm"
    >
      {loading ? "Saliendo..." : "Salir"}
    </button>
  );
}