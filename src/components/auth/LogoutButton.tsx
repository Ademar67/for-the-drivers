"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Corrected import
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);

    try {
      // Clear the server-side session cookie
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Sign out from the client-side Firebase instance
      await signOut(auth);
      
      // Redirect to login page
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={onLogout}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>{loading ? "Saliendo..." : "Salir"}</span>
    </Button>
  );
}
