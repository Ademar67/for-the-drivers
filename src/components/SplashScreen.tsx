'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setAnimateOut(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem('splashSeen', 'true');
      onFinish();
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0054A6] transition-opacity duration-500 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%)]" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-600" />
      <div className="absolute bottom-2 left-0 right-0 h-2 bg-white" />

      <div
        className={`relative z-10 flex flex-col items-center justify-center px-6 transition-all duration-700 ${
          animateOut
            ? 'translate-y-2 scale-95 opacity-0'
            : 'translate-y-0 scale-100 opacity-100'
        }`}
      >
        <Image
  src="/liquimoly-logo-v3.png"
  alt="Liqui Moly"
  width={500}
  height={500}
  priority
  quality={100}
  className="h-auto w-[180px] sm:w-[220px] md:w-[260px] object-contain"
/>

        <p className="mt-5 text-center text-sm font-semibold tracking-[0.28em] text-white/90 sm:text-base">
          FOR THE DRIVERS
        </p>

        <div className="mt-8 h-1.5 w-36 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full animate-pulse rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}