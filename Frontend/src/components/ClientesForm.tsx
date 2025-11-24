import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface Cliente {
  cliCodigo: number;
  cliNombre: string;
  cliCalle: string;
  tarjetaActiva: Tarjeta | null;
  tarjetasInactivas: Tarjeta[];
}

interface Tarjeta {
  tarCodigo: string;
  tarValor: number;
  tarCuota: number;
  tarFecha: string;
  tiempo: number;
  fp: string;
  saldoActual: number;
  iten: number;
  estado: string;
  descripciones: Descripcion[];
}

interface Descripcion {
  fechaAct: string;
  desFecha: string;
  desAbono: number;
  desResta: number;
  id: number;
}

const ClientesForm: React.FC = () => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cedulaBusqueda, setCedulaBusqueda] = useState<string>("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditables, setDatosEditables] = useState({
    cliNombre: "",
    cliCalle: "",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientesExistentes, setClientesExistentes] = useState<Cliente[]>([]);
  const [mostrarListaPorNombre, setMostrarListaPorNombre] = useState(false);

  const inputCedulaRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Cargar todos los clientes al inicio
  const cargarClientesExistentes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      if (res.ok) {
        const data = await res.json();
        setClientesExistentes(data);
      }
    } catch (err) {
      console.error("Error al cargar lista de clientes:", err);
    }
  };

  useEffect(() => {
    cargarClientesExistentes();
  }, []);

  const formatFecha = (fechaISO: string): string => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = String(fecha.getFullYear()).slice(-2);
    return `${dia}-${mes}-${año}`;
  };

  // Cargar cliente por cédula
  const cargarCliente = async (cedula: string) => {
    if (!cedula) return;
    setCargando(true);
    setError(null);
    try {
      // Cargar historial completo (tarjetas activas + inactivas)
      const resCliente = await fetch(
        `${API_URL}/clientes/${cedula}/historial-tarjetas`
      );
      if (!resCliente.ok) {
        if (resCliente.status === 404) throw new Error("Cliente no encontrado");
        throw new Error(`Error ${resCliente.status}`);
      }
      const data = await resCliente.json();
      setCliente(data);

    } catch (err: any) {
      setError(err.message || "Error al cargar cliente");
      setCliente(null);
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = () => {
    if (!cliente) return;
    setModoEdicion(true);
    setDatosEditables({
      cliNombre: cliente.cliNombre,
      cliCalle: cliente.cliCalle,
    });
  };

  const guardarEdicion = async () => {
    if (!cliente) return;
    const { cliNombre, cliCalle } = datosEditables;
    if (!cliNombre.trim() || !cliCalle.trim()) {
      alert("Nombre y dirección son obligatorios");
      return;
    }
    try {
      setCargando(true);
      const res = await fetch(
        `${API_URL}/clientes/${cliente.cliCodigo}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliNombre, cliCalle }),
        }
      );
      if (!res.ok) throw new Error("Error al actualizar cliente");
      setCliente({ ...cliente, cliNombre, cliCalle });
      setModoEdicion(false);
      alert("✅ Cliente actualizado correctamente");
    } catch (err: any) {
      alert(`❌ ${err.message || "Error al guardar"}`);
    } finally {
      setCargando(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mostrarListaPorNombre) {
      cargarCliente(cedulaBusqueda);
    }
  };

  const handleSeleccionCliente = (cliCodigo: string) => {
    const clienteSeleccionado = clientesExistentes.find(
      (c) => c.cliCodigo.toString() === cliCodigo
    );
    if (clienteSeleccionado) {
      cargarCliente(cliCodigo);
      setCedulaBusqueda(cliCodigo); // sincronizar campo
    }
  };

  useEffect(() => {
    inputCedulaRef.current?.focus();
  }, []);

  return (
    <div className="bg-gray-200 dark:bg-gray-800 h-screen p-4 font-sans overflow-hidden">
      <div className="mx-auto h-full max-w-[100vw] flex flex-col">
        {/* Encabezado */}
        <div className="bg-white dark:bg-gray-700 px-3 py-1 mb-2 rounded shadow">
          <p className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Gestión de Clientes — Sergio Escalona
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
            {/* Toggle para búsqueda por nombre */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="clienteExistente"
                checked={mostrarListaPorNombre}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setMostrarListaPorNombre(checked);
                  if (!checked) {
                    setCedulaBusqueda("");
                    setCliente(null);
                  }
                }}
                className="mr-1"
              />
              <label
                htmlFor="clienteExistente"
                className="text-sm font-bold text-gray-800 dark:text-white"
              >
                Cliente Existente
              </label>
            </div>

            {mostrarListaPorNombre ? (
              <select
                value={cedulaBusqueda}
                onChange={(e) => handleSeleccionCliente(e.target.value)}
                className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 text-sm w-64"
              >
                <option value="">Seleccionar cliente...</option>
                {clientesExistentes.map((c) => (
                  <option key={c.cliCodigo} value={c.cliCodigo}>
                    {c.cliNombre} ({c.cliCodigo})
                  </option>
                ))}
              </select>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 ml-2"
              >
                <label className="text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
                  Cédula:
                </label>
                <input
                  ref={inputCedulaRef}
                  type="text"
                  value={cedulaBusqueda}
                  onChange={(e) =>
                    setCedulaBusqueda(e.target.value.replace(/\D/g, ""))
                  }
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-1 text-sm w-32"
                  placeholder="Ej: 123456"
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
          ) : cliente ? (
            <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
              {/* Columna izquierda */}
              <div className="col-span-8 flex flex-col gap-2 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded shadow">
                  <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-2">
                    Datos del Cliente
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                        Cédula
                      </label>
                      <input
                        type="text"
                        value={cliente.cliCodigo}
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
                          value={datosEditables.cliNombre}
                          onChange={(e) =>
                            setDatosEditables({
                              ...datosEditables,
                              cliNombre: e.target.value,
                            })
                          }
                          className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                        />
                      ) : (
                        <input
                          type="text"
                          value={cliente.cliNombre}
                          readOnly
                          className="w-full bg-gray-200 dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                        />
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                        Dirección
                      </label>
                      {modoEdicion ? (
                        <input
                          type="text"
                          value={datosEditables.cliCalle}
                          onChange={(e) =>
                            setDatosEditables({
                              ...datosEditables,
                              cliCalle: e.target.value,
                            })
                          }
                          className="w-full bg-white dark:bg-gray-600 text-sm px-2 py-1 border border-gray-400 dark:border-gray-500 dark:text-white"
                        />
                      ) : (
                        <input
                          type="text"
                          value={cliente.cliCalle}
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

                {cliente.tarjetaActiva ? (
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded shadow">
                    <h2 className="text-sm font-bold text-green-800 dark:text-green-200 mb-2">
                      Tarjeta Activa
                    </h2>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-bold">Valor:</span>{" "}
                        {cliente.tarjetaActiva.tarValor}
                      </div>
                      <div>
                        <span className="font-bold">Cuota:</span>{" "}
                        {cliente.tarjetaActiva.tarCuota}
                      </div>
                      <div>
                        <span className="font-bold">Plazo:</span>{" "}
                        {cliente.tarjetaActiva.tiempo} días
                      </div>
                      <div>
                        <span className="font-bold">FP:</span>{" "}
                        {cliente.tarjetaActiva.fp}
                      </div>
                      <div>
                        <span className="font-bold">Fecha:</span>{" "}
                        {formatFecha(cliente.tarjetaActiva.tarFecha)}
                      </div>
                      <div>
                        <span className="font-bold">Saldo:</span>{" "}
                        {cliente.tarjetaActiva.saldoActual}
                      </div>
                      <div>
                        <span className="font-bold">Iten:</span>{" "}
                        {cliente.tarjetaActiva.iten}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ El cliente no tiene tarjeta activa.
                  </div>
                )}
              </div>

              {/* Columna derecha */}
              <div className="col-span-4 flex flex-col gap-2 overflow-hidden">
                <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-sm rounded-t">
                  TARJETAS INACTIVAS
                </div>
                <div className="bg-white dark:bg-gray-700 p-2 rounded-b shadow flex-1 overflow-y-auto">
                  {cliente.tarjetasInactivas.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center">
                      No hay tarjetas inactivas
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                          <th className="text-left">Valor</th>
                          <th className="text-left">FP</th>
                          <th className="text-left">Fecha</th>
                          <th className="text-left">Saldo Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cliente.tarjetasInactivas.map((tar, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-200 dark:border-gray-600 last:border-0"
                          >
                            <td>{tar.tarValor}</td>
                            <td>{tar.fp}</td>
                            <td>{formatFecha(tar.tarFecha)}</td>
                            <td>{tar.saldoActual}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>
                {mostrarListaPorNombre
                  ? "Seleccione un cliente de la lista"
                  : 'Ingrese una cédula o active "Cliente Existente"'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesForm;
