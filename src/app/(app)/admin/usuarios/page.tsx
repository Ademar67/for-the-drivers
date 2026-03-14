'use client';

import { useEffect, useState } from 'react';
import { useUsuarioActual } from '@/hooks/use-usuario-actual';
import {
  listenUsuarios,
  UsuarioFS,
  actualizarRolUsuario,
  actualizarZonaUsuario,
} from '@/lib/firestore/usuarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminUsuariosPage() {
  const { usuario, loading, esAdmin } = useUsuarioActual();
  const [usuarios, setUsuarios] = useState<UsuarioFS[]>([]);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [zonas, setZonas] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!esAdmin) return;

    const unsub = listenUsuarios((data) => {
      setUsuarios(data);

      const nextZonas: Record<string, string> = {};
      data.forEach((u) => {
        nextZonas[u.uid] = u.zona ?? '';
      });
      setZonas(nextZonas);
    });

    return () => unsub();
  }, [esAdmin]);

  const handleRolChange = async (uid: string, rol: 'admin' | 'vendedor') => {
    try {
      setSavingUid(uid);
      await actualizarRolUsuario(uid, rol);
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el rol.');
    } finally {
      setSavingUid(null);
    }
  };

  const handleZonaSave = async (uid: string) => {
    try {
      setSavingUid(uid);
      await actualizarZonaUsuario(uid, zonas[uid] ?? '');
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar la zona.');
    } finally {
      setSavingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Cargando usuario...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">No hay usuario autenticado.</p>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta sección es solo para administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administra roles y zonas de los vendedores.
        </p>
      </div>

      <div className="grid gap-4">
        {usuarios.map((u) => {
          const esYo = usuario.uid === u.uid;

          return (
            <Card key={u.uid}>
              <CardContent className="p-5">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end">
                  <div>
                    <p className="text-base font-semibold">{u.nombre}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <p className="mt-1 text-xs text-gray-500">{u.uid}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Rol</label>
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={u.rol}
                      disabled={savingUid === u.uid || esYo}
                      onChange={(e) =>
                        handleRolChange(
                          u.uid,
                          e.target.value as 'admin' | 'vendedor'
                        )
                      }
                    >
                      <option value="vendedor">vendedor</option>
                      <option value="admin">admin</option>
                    </select>
                    {esYo && (
                      <p className="mt-1 text-xs text-gray-500">
                        No puedes cambiar tu propio rol aquí.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Zona</label>
                    <input
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={zonas[u.uid] ?? ''}
                      onChange={(e) =>
                        setZonas((prev) => ({
                          ...prev,
                          [u.uid]: e.target.value,
                        }))
                      }
                      disabled={savingUid === u.uid}
                      placeholder="Ej. Morelia"
                    />
                  </div>

                  <div>
                    <Button
                      onClick={() => handleZonaSave(u.uid)}
                      disabled={savingUid === u.uid}
                      className="w-full lg:w-auto"
                    >
                      {savingUid === u.uid ? 'Guardando...' : 'Guardar zona'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {usuarios.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No hay usuarios registrados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}