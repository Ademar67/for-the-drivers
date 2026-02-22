
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial state from navigator
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Hide the "Connected" message after a few seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not triggered by an event
  if (!showStatus && isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[2000] py-2 px-4 text-center text-sm font-medium text-white transition-all',
        isOnline ? 'bg-green-600' : 'bg-red-600'
      )}
    >
      {isOnline ? '🟢 Conectado' : '🔴 Sin conexión'}
    </div>
  );
}
