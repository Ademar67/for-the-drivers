'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const isLogin = pathname === '/login';
      if (!user && !isLogin) router.replace('/login');
      setReady(true);
    });

    return () => unsub();
  }, [router, pathname]);

  if (!ready) return <div className="p-6">Cargando...</div>;
  return <>{children}</>;
}