
'use client';

import { useMemo, useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { geocodificarDireccion } from '@/lib/geocoding';
import { useAuth } from '@/context/AuthProvider';

export default function CrearClienteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',

    tipo: 'prospecto' as 'prospecto' | 'cliente' | 'inactivo',
    tipoZona: 'local' as 'local' | 'foraneo',

    ciudad: '',
    domicilio: '',
    nota: '',

    diaVisita: 'lunes',
    frecuencia: 'mensual',
    semanaVisita: 2,
  });

  const semanasDisponibles = useMemo(() => {
    return form.tipoZona === 'foraneo' ? [1, 4] : [2, 3];
  }, [form.tipoZona]);

  if (!open) return null;

  function handleTipoZonaChange(value: 'local' | 'foraneo') {
    const semanaDefault = value === 'foraneo' ? 1 : 2;

    setForm((prev) => ({
      ...prev,
      tipoZona: value,
      semanaVisita: semanaDefault,
    }));
  }

  async function guardar() {
    try {
      if (!user) {
        alert('Debes iniciar sesión para guardar clientes.');
        return;
      }

      setLoading(true);

      let lat: number | null = null;
      let lng: number | null = null;

      const nombreLimpio = form.nombre.trim();
      const telefonoLimpio = form.telefono.trim();
      const emailLimpio = form.email.trim();

      const domicilioLimpio = form.domicilio.trim();
      const ciudadLimpia = form.ciudad.trim();
      const notaLimpia = form.nota.trim();

      if (!nombreLimpio) {
        alert('Escribe el nombre del cliente.');
        return;
      }

      if (!ciudadLimpia) {
        alert('Escribe la ciudad del cliente.');
        return;
      }

      if (domicilioLimpio && ciudadLimpia) {
        try {
          const direccionCompleta = `${domicilioLimpio}, ${ciudadLimpia}, Michoacán, México`;

          console.log(
            'Dirección enviada a geocoding:',
            direccionCompleta
          );

          let coords = await geocodificarDireccion(
            direccionCompleta
          );

          if (!coords) {
            const direccionFallback = `${ciudadLimpia}, Michoacán, México`;

            console.warn(
              'Falló dirección exacta. Intentando fallback con ciudad:',
              direccionFallback
            );

            coords = await geocodificarDireccion(
              direccionFallback
            );
          }

          console.log('Coordenadas recibidas:', coords);

          lat = coords?.lat ?? null;
          lng = coords?.lng ?? null;
        } catch (geoError) {
          console.warn(
            'No se pudo geocodificar la dirección del cliente:',
            geoError
          );
        }
      } else {
        console.warn(
          'No se intentó geocodificar porque falta domicilio o ciudad.'
        );
      }

      console.log('USER UID:', user?.uid);
      console.log('USER EMAIL:', user?.email);
      console.log('Lat final:', lat);
      console.log('Lng final:', lng);
      console.log('DB LISTA PARA GUARDAR');

      const docRef = await addDoc(collection(db, 'clientes'), {
        ownerId: user.uid,
        ownerEmail: user.email ?? '',

        nombre: nombreLimpio,
        telefono: telefonoLimpio,
        email: emailLimpio,

        tipo: form.tipo,
        tipoZona: form.tipoZona,

        ciudad: ciudadLimpia,
        domicilio: domicilioLimpio,

        diaVisita: form.diaVisita,
        frecuencia: form.frecuencia,
        semanaVisita: form.semanaVisita,

        nota: notaLimpia,
        notaVisita: notaLimpia,
        notas: '',

        activo: form.tipo !== 'inactivo',

        lat,
        lng,

        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('CLIENTE GUARDADO OK');
      console.log('DOC ID:', docRef.id);

      alert('Cliente guardado correctamente');

      setForm({
        nombre: '',
        telefono: '',
        email: '',

        tipo: 'prospecto',
        tipoZona: 'local',

        ciudad: '',
        domicilio: '',
        nota: '',

        diaVisita: 'lunes',
        frecuencia: 'mensual',
        semanaVisita: 2,
      });

      onClose();
    } catch (error: any) {
      console.error('ERROR AL GUARDAR CLIENTE:', error);

      alert(
        error?.message ??
          'Error desconocido al guardar cliente'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[420px] space-y-3 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">
          Agregar cliente
        </h2>

        <input
          placeholder="Nombre"
          className="w-full rounded border p-2"
          value={form.nombre}
          onChange={(e) =>
            setForm({
              ...form,
              nombre: e.target.value,
            })
          }
        />

        <input
          placeholder="Teléfono"
          className="w-full rounded border p-2"
          value={form.telefono}
          onChange={(e) =>
            setForm({
              ...form,
              telefono: e.target.value,
            })
          }
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full rounded border p-2"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          placeholder="Ciudad"
          className="w-full rounded border p-2"
          value={form.ciudad}
          onChange={(e) =>
            setForm({
              ...form,
              ciudad: e.target.value,
            })
          }
        />

        <input
          placeholder="Domicilio"
          className="w-full rounded border p-2"
          value={form.domicilio}
          onChange={(e) =>
            setForm({
              ...form,
              domicilio: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Nota de la visita"
          className="w-full rounded border p-2"
          rows={3}
          value={form.nota}
          onChange={(e) =>
            setForm({
              ...form,
              nota: e.target.value,
            })
          }
        />

        <select
          className="w-full rounded border p-2"
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo: e.target.value as typeof form.tipo,
            })
          }
        >
          <option value="prospecto">
            Prospecto
          </option>
          <option value="cliente">
            Cliente
          </option>
          <option value="inactivo">
            Inactivo
          </option>
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.tipoZona}
          onChange={(e) =>
            handleTipoZonaChange(
              e.target.value as 'local' | 'foraneo'
            )
          }
        >
          <option value="local">Local</option>
          <option value="foraneo">Foráneo</option>
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.diaVisita}
          onChange={(e) =>
            setForm({
              ...form,
              diaVisita: e.target.value,
            })
          }
        >
          <option value="lunes">lunes</option>
          <option value="martes">martes</option>
          <option value="miercoles">miercoles</option>
          <option value="jueves">jueves</option>
          <option value="viernes">viernes</option>
          <option value="sabado">sabado</option>
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.frecuencia}
          onChange={(e) =>
            setForm({
              ...form,
              frecuencia: e.target.value,
            })
          }
        >
          <option value="mensual">
            mensual
          </option>
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.semanaVisita}
          onChange={(e) =>
            setForm({
              ...form,
              semanaVisita: Number(
                e.target.value
              ),
            })
          }
        >
          {semanasDisponibles.map((semana) => (
            <option
              key={semana}
              value={semana}
            >
              Semana {semana}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? 'Guardando...'
              : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}