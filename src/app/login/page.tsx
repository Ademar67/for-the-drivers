'use client';

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        setError('Credenciales incorrectas.');
      } else if (code === 'auth/user-not-found') {
        setError('Ese usuario no existe.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde.');
      } else {
        setError(err?.message ?? 'No se pudo iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError(
        'Ingresa tu correo electrónico para recuperar tu contraseña.'
      );
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        'Se envió un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.'
      );
    } catch (err: any) {
      const code = err?.code as string | undefined;

      if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese correo.');
      } else {
        setError(
          'No fue posible enviar el correo de recuperación.'
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-lg p-6"
      >
        <h1 className="text-xl font-bold">
          Iniciar sesión
        </h1>

        <div className="space-y-2">
          <label className="text-sm">Email</label>

          <input
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Contraseña</label>

          <input
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p className="text-sm text-green-600">
            {message}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="w-full text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {resetLoading
            ? 'Enviando correo...'
            : '¿Olvidaste tu contraseña?'}
        </button>
      </form>
    </div>
  );
}