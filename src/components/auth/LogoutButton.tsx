'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-500 hover:text-red-700"
    >
      Cerrar sesión
    </button>
  );
}