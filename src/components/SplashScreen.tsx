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
    }, 4200);

    const finishTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem('splashSeen', 'true');
      onFinish();
    }, 5200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0054A6] transition-opacity duration-700 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${
          animateOut
            ? 'scale-95 translate-y-2 opacity-0'
            : 'scale-100 translate-y-0 opacity-100'
        }`}
      >
        <Image
          src="/splash-car.png"
          alt="Liqui Moly"
          width={520}
          height={520}
          priority
          className="w-[280px] sm:w-[320px] object-contain"
        />

        <p className="mt-6 text-sm font-semibold tracking-[0.35em] text-white">
          FOR THE DRIVERS
        </p>
      </div>
    </div>
  );
}