"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(online);
    if (!online) setShowStatus(true); // ✅ si arranca offline, mostrar banner

    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const handleOnline = () => {
      clearHideTimer();
      setIsOnline(true);
      setShowStatus(true);
      hideTimer.current = setTimeout(() => setShowStatus(false), 2500);
    };

    const handleOffline = () => {
      clearHideTimer();
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearHideTimer();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[2000] py-2 px-4 text-center text-sm font-medium text-white",
        isOnline ? "bg-green-600" : "bg-red-600"
      )}
    >
      {isOnline ? "🟢 Conectado" : "🔴 Sin conexión"}
    </div>
  );
}
