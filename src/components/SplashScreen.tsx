'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem('splashSeen', 'true');
      onFinish();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center px-6">
        <Image
          src="/icon-512x512.png"
          alt="Liqui Moly"
          width={260}
          height={260}
          priority
          className="h-auto w-[200px] sm:w-[220px] md:w-[260px] object-contain"
        />

        <div className="mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-full animate-pulse rounded-full bg-blue-700" />
        </div>
      </div>
    </div>
  );
}