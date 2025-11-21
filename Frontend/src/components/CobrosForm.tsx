// src/pages/CobroForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Cobro {
  cobCodigo: string;
  cobNombre: string;
  cobDireccion: string | null;
  cobMoto: string | null;
  cobTelefono: string | null;
}

const CobroForm: React.FC = () => {
  const [cobro, setCobro] = useState<Cobro | null>(null);
  const [codigoBusqueda, setCodigoBusqueda] = useState<string>('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditables, setDatosEditables] = useState({
    cobNombre: '',
    cobDireccion: '',
    cobMoto: '',
    cobTelefono: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cobradoresExistentes, setCobradoresExistentes] = useState<Cobro[]>([]);
  const [mostrarListaPorNombre, setMostrarListaPorNombre] = useState(false);

  const inputCodigoRef = useRef<HTMLInputElement>(null);

  // Cargar todos los cobradores al inicio
  const cargarCobradoresExistentes = async () => {
    try {
      const res = await fetch('http://localhost:3000/cobros');
      if (res.ok) {
        const data: Cobro[] = await res.json();
        setCobradoresExistentes(data);
      }
    } catch (err) {
      console.error('Error al cargar lista de cobradores:', err);
    }
  };

  useEffect(() => {
    cargarCobradoresExistentes();
  }, []);

  const cargarCobro = async (codigo: string) => {
    if (!codigo) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/cobros/${codigo}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Cobrador no encontrado');
        throw new Error(`Error ${res.status}`);
      }
      const data: Cobro = await res.json();
      setCobro(data);
      setDatosEditables({
        cobNombre: data.cobNombre,
        cobDireccion: data.cobDireccion || '',
        cobMoto: data.cobMoto || '',
        cobTelefono: data.cobTelefono || '',
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar cobrador');
      setCobro(null);
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionCobrador = (codigo: string) => {
    const cobradorSeleccionado = cobradoresExistentes.find((c) => c.cobCodigo === codigo);
    if (cobradorSeleccionado) {
      cargarCobro(codigo);
      setCodigoBusqueda(codigo);
    }
  };

  const iniciarEdicion = () => {
    if (!cobro) return;
    setModoEdicion(true);
  };

  const guardarEdicion = async () => {
    if (!cobro) return;
    const { cobNombre, cobDireccion, cobMoto, cobTelefono } = datosEditables;
    if (!cobNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`http://localhost:3000/cobros/${cobro.cobCodigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cobNombre,
          cobDireccion: cobDireccion || undefined,
          cobMoto: cobMoto || undefined,
          cobTelefono: cobTelefono || undefined,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar cobrador');
      setCobro({
        ...cobro,
        cobNombre,
        cobDireccion: cobDireccion || null,
        cobMoto: cobMoto || null,
        cobTelefono: cobTelefono || null,
      });
      setModoEdicion(false);
      alert('✅ Cobrador actualizado correctamente');
    } catch (err: any) {
      alert(`❌ ${err.message || 'Error al guardar'}`);
    } finally {
      setCargando(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    if (cobro) {
      setDatosEditables({
        cobNombre: cobro.cobNombre,
        cobDireccion: cobro.cobDireccion || '',
        cobMoto: cobro.cobMoto || '',
        cobTelefono: cobro.cobTelefono || '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mostrarListaPorNombre) {
      cargarCobro(codigoBusqueda);
    }
  };

  useEffect(() => {
    inputCodigoRef.current?.focus();
  }, [mostrarListaPorNombre]);

  return (
    <div className="bg-gray-200 dark:bg-gray-800 h-screen p-4 font-sans overflow-hidden">
      <div className="mx-auto h-full max-w-[100vw] flex flex-col">
        {/* Encabezado */}
        <div className="bg-white dark:bg-gray-700 px-3 py-1 mb-2 rounded shadow">
          <p className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Gestión de Cobradores — Sergio Escalona
          </p>
          <Link
            to="/"
            className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:underline text-m"
          >
            ← Volver al Menú
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 mb-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col h-full gap-2">
          {/* Búsqueda */}
          <div className="bg-white dark:bg-gray-700 p-2 rounded shadow flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="cobradorExistente"
                checked={mostrarListaPorNombre}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setMostrarListaPorNombre(checked);
                  if (!checked) {
                    setCodigoBusqueda('');
                    setCobro(null);
                  }
                }}
                className="mr-1"
              />
              <label
                htmlFor="cobradorExistente"
                className="text-sm font-bold text-gray-800 dark:text-white"
              >
                Cobrador Existente
              </label>
            </div>

            {mostrarListaPorNombre ? (
              <select
                value={codigoBusqueda}
                onChange={(e) => handleSeleccionCobrador(e.target.value)}
                className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 text-sm w-64"
              >
                <option value="">Seleccionar cobrador...</option>
                {cobradoresExistentes.map((c) => (
                  <option key={c.cobCodigo} value={c.cobCodigo}>
                    {c.cobNombre} ({c.cobCodigo})
                  </option>
                ))}
              </select>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2 ml-2">
                <label className="text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
                  Código:
                </label>
                <input
                  ref={inputCodigoRef}
                  type="text"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 text-sm w-32"
                  placeholder="Ej: C001"
                />
                <button
                  type="submit"
                  disabled={cargando}
                  className="border border-blue-600 text-blue-600 dark:text-blue-300 dark:border-blue-400 px-2 py-1 text-sm bg-white dark:bg-gray-600 hover:bg-blue-50"
                >
                  Buscar
                </button>
              </form>
            )}
          </div>

          {/* Contenido principal */}
          {cargando ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-300">
              Cargando...
            </div>
          ) : cobro ? (
            <div className="bg-white dark:bg-gray-700 p-3 rounded shadow flex-1 overflow-hidden">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-2">
                Datos del Cobrador
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                    Código
                  </label>
                  <input
                    type="text"
                    value={cobro.cobCodigo}
                    readOnly
                    className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                    Nombre
                  </label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditables.cobNombre}
                      onChange={(e) =>
                        setDatosEditables({ ...datosEditables, cobNombre: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={cobro.cobNombre}
                      readOnly
                      className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                    Dirección
                  </label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditables.cobDireccion}
                      onChange={(e) =>
                        setDatosEditables({ ...datosEditables, cobDireccion: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={cobro.cobDireccion || ''}
                      readOnly
                      className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                    Moto
                  </label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditables.cobMoto}
                      onChange={(e) =>
                        setDatosEditables({ ...datosEditables, cobMoto: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={cobro.cobMoto || ''}
                      readOnly
                      className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                    Teléfono
                  </label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={datosEditables.cobTelefono}
                      onChange={(e) =>
                        setDatosEditables({ ...datosEditables, cobTelefono: e.target.value })
                      }
                      className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={cobro.cobTelefono || ''}
                      readOnly
                      className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-1">
                {modoEdicion ? (
                  <>
                    <button
                      onClick={guardarEdicion}
                      className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={iniciarEdicion}
                    className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Editar Datos
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>
                {mostrarListaPorNombre
                  ? 'Seleccione un cobrador de la lista'
                  : 'Ingrese un código o active "Cobrador Existente"'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CobroForm;