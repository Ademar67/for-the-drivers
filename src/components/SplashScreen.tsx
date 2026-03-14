'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // entrada suave del carro
    const startTimer = setTimeout(() => {
      setAnimateIn(true);
    }, 200);

    // empieza salida
    const exitTimer = setTimeout(() => {
      setAnimateOut(true);
    }, 4500);

    // termina splash
    const finishTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem('splashSeen', 'true');
      onFinish();
    }, 5500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0054A6] transition-opacity duration-1000 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${
          animateIn
            ? 'scale-100 opacity-100'
            : 'scale-90 opacity-0'
        } ${
          animateOut
            ? 'scale-95 translate-y-2 opacity-0'
            : ''
        }`}
      >
        <Image
          src="/splash-car.png"
          alt="Liqui Moly"
          width={600}
          height={600}
          priority
          className="w-[320px] sm:w-[380px] object-contain"
        />

        <p className="mt-6 text-center text-sm font-semibold tracking-[0.35em] text-white sm:text-base">
          FOR THE DRIVERS
        </p>
      </div>
    </div>
  );
}