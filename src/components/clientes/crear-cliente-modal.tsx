'use client';

import { useMemo, useState } from 'react';
import { crearCliente } from '@/lib/firestore/clientes';
import { geocodificarDireccion } from '@/lib/geocoding';

export default function CrearClienteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
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
      setLoading(true);

      let lat: number | null = null;
      let lng: number | null = null;

      const nombreLimpio = form.nombre.trim();
      const domicilioLimpio = form.domicilio.trim();
      const ciudadLimpia = form.ciudad.trim();
      const notaLimpia = form.nota.trim();

      if (domicilioLimpio && ciudadLimpia) {
        try {
          const direccionCompleta = `${domicilioLimpio}, ${ciudadLimpia}, Michoacán, México`;

          console.log('Dirección enviada a geocoding:', direccionCompleta);

          let coords = await geocodificarDireccion(direccionCompleta);

          if (!coords) {
            const direccionFallback = `${ciudadLimpia}, Michoacán, México`;
            console.warn('Falló dirección exacta. Intentando fallback con ciudad:', direccionFallback);

            coords = await geocodificarDireccion(direccionFallback);
          }

          console.log('Coordenadas recibidas:', coords);

          lat = coords?.lat ?? null;
          lng = coords?.lng ?? null;
        } catch (geoError) {
          console.warn('No se pudo geocodificar la dirección del cliente:', geoError);
        }
      } else {
        console.warn('No se intentó geocodificar porque falta domicilio o ciudad.');
      }

      console.log('Lat final:', lat);
      console.log('Lng final:', lng);

      await crearCliente({
        nombre: nombreLimpio,
        tipo: form.tipo,
        tipoZona: form.tipoZona,
        ciudad: ciudadLimpia,
        domicilio: domicilioLimpio,
        diaVisita: form.diaVisita,
        frecuencia: form.frecuencia,
        semanaVisita: form.semanaVisita,
        nota: notaLimpia,
        lat,
        lng,
      });

      setForm({
        nombre: '',
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
    } catch (error) {
      console.error('ERROR AL GUARDAR CLIENTE:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Error desconocido al guardar cliente'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[420px] space-y-3">
        <h2 className="text-lg font-semibold">Agregar cliente</h2>

        <input
          placeholder="Nombre"
          className="w-full border p-2 rounded"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <input
          placeholder="Ciudad"
          className="w-full border p-2 rounded"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
        />

        <input
          placeholder="Domicilio"
          className="w-full border p-2 rounded"
          value={form.domicilio}
          onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
        />

        <textarea
          placeholder="Nota de la visita"
          className="w-full border p-2 rounded"
          rows={3}
          value={form.nota}
          onChange={(e) => setForm({ ...form, nota: e.target.value })}
        />

        <select
          className="w-full border p-2 rounded"
          value={form.tipo}
          onChange={(e) =>
            setForm({ ...form, tipo: e.target.value as typeof form.tipo })
          }
        >
          <option value="prospecto">Prospecto</option>
          <option value="cliente">Cliente</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.tipoZona}
          onChange={(e) =>
            handleTipoZonaChange(e.target.value as 'local' | 'foraneo')
          }
        >
          <option value="local">Local</option>
          <option value="foraneo">Foráneo</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.diaVisita}
          onChange={(e) => setForm({ ...form, diaVisita: e.target.value })}
        >
          <option value="lunes">lunes</option>
          <option value="martes">martes</option>
          <option value="miercoles">miercoles</option>
          <option value="jueves">jueves</option>
          <option value="viernes">viernes</option>
          <option value="sabado">sabado</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.frecuencia}
          onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
        >
          <option value="mensual">mensual</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.semanaVisita}
          onChange={(e) =>
            setForm({ ...form, semanaVisita: Number(e.target.value) })
          }
        >
          {semanasDisponibles.map((semana) => (
            <option key={semana} value={semana}>
              Semana {semana}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}