
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSendPasswordResetEmail } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sendPasswordResetEmail, sending, error] = useSendPasswordResetEmail(auth);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendPasswordResetEmail(email);
    if (success) {
      setEmailSent(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center space-y-2">
          <Image src="/logo-liqui-moly.png" alt="Liqui Moly" width={60} height={60} className="mx-auto"/>
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>Ingresa tu email para recibir un enlace de recuperación.</CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <p className="text-green-600">¡Correo enviado! Revisa tu bandeja de entrada.</p>
              <Link href="/login" passHref>
                <Button variant="outline" className="w-full">Volver a Iniciar Sesión</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error.message}</p>}
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar Correo de Recuperación'}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/login" passHref>
              <Button variant="link" className="px-1">Volver a Iniciar Sesión</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
