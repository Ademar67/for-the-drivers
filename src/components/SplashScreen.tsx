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
    }, 1900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0054A6] transition-opacity duration-500 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center px-6 transition-all duration-700 ${
          animateOut
            ? 'scale-95 translate-y-2 opacity-0'
            : 'scale-100 translate-y-0 opacity-100'
        }`}
      >
        <div className="mb-8 flex justify-center">
          <Image
            src="/liquimoly-logo.png"
            alt="Liqui Moly"
            width={700}
            height={700}
            priority
            className="h-auto w-[260px] sm:w-[320px] md:w-[380px] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          />
        </div>

        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-full animate-pulse rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}