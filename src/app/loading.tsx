'use client';

import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 animate-splash">
        <Image
          src="/liquimoly-logo-v4.png"
          alt="Liqui Moly"
          width={160}
          height={160}
          priority
        />
        <p className="text-sm text-gray-500">
          Cargando Centro de Ventas…
        </p>
      </div>
    </div>
  );
}
