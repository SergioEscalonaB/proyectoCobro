import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Cliente {
  cliCodigo: number;
  cliNombre: string;
  cliCalle: string;
  estado: string;
  saldoTotal: number;
  tarjetaActiva: {
    tarValor: number;
    tarCuota: number;
    tarFecha: string;
    tiempo: number;
    fp: string;
    saldoActual: number;
    iten: number;
  } | null;
}

interface Cobrador {
  cobCodigo: string;
  cobNombre: string;
}

const AbonoForm: React.FC = () => {
  const navigate = useNavigate();

  // Estados
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [cobradorSeleccionado, setCobradorSeleccionado] = useState<string>("");
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Cargar cobradores al iniciar
  useEffect(() => {
    cargarCobradores();
  }, []);

  // Cargar primer cliente cuando se selecciona un cobrador
  useEffect(() => {
    if (cobradorSeleccionado) {
      cargarPrimerCliente(cobradorSeleccionado);
    } else {
      setClienteActual(null);
    }
  }, [cobradorSeleccionado]);

  const cargarCobradores = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch("http://localhost:3000/cobros");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCobradores(data);
    } catch (err: any) {
      console.error("Error cargando cobradores:", err);
      setError(`Error al cargar los cobradores: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const cargarPrimerCliente = async (cobCodigo: string) => {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `http://localhost:3000/clientes/cobrador/${cobCodigo}/primer-cliente`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setClienteActual(null);
          setError(`No hay clientes activos para el cobrador ${cobCodigo}`);
          return;
        }
        throw new Error(`Error al cargar el cliente: ${response.status}`);
      }

      const cliente = await response.json();
      setClienteActual(cliente);
    } catch (err: any) {
      console.error("Error cargando cliente:", err);
      setError(`Error al cargar el cliente: ${err.message}`);
      setClienteActual(null);
    } finally {
      setCargando(false);
    }
  };

  const navegarCliente = async (direccion: "siguiente" | "anterior") => {
    if (!clienteActual || !cobradorSeleccionado) return;

    try {
      setCargando(true);
      const itenActual = clienteActual.tarjetaActiva?.iten;
      if (!itenActual) return;

      const response = await fetch(
        `http://localhost:3000/clientes/cobrador/${cobradorSeleccionado}/navegar?iten=${itenActual}&direccion=${direccion}`
      );

      if (response.ok) {
        const cliente = await response.json();
        setClienteActual(cliente);
        setError("");
      } else {
        setError(
          `No hay más clientes hacia ${
            direccion === "siguiente" ? "adelante" : "atrás"
          }`
        );
      }
    } catch (err: any) {
      console.error("Error navegando:", err);
      setError("Error al navegar entre clientes");
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const calcularDiasVencidos = (fechaInicio: string) => {
    try {
      const inicio = new Date(fechaInicio);
      const hoy = new Date();
      const diferencia = hoy.getTime() - inicio.getTime();
      return Math.floor(diferencia / (1000 * 3600 * 24));
    } catch (error) {
      return 0;
    }
  };

  // Función para manejar el envío del formulario de abono
  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica para procesar abono
    console.log("Procesando abono...");
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-800 h-screen p-4 font-sans overflow-hidden">
      <div className="mx-auto h-full max-w-[100vw] flex flex-col">
        {/* Sección de Créditos o Encabezado */}
        <div className="bg-white dark:bg-gray-700 px-3 py-1 mb-1 rounded shadow">
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Creditos Realizado por Sergio Escalona
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 mb-2 rounded text-xs">
            {error}
          </div>
        )}

        {/* Contenedor principal de la aplicación (Grid) */}
        <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
          {/* Columna Izquierda (Formulario Principal) - 9 de 12 columnas */}
          <div className="col-span-9 flex flex-col overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-700 mb-2 p-2 rounded shadow flex-1 flex flex-col overflow-hidden">
              {/* Fila 1: Código del Cobro */}
              <div className="items-center mb-2 flex gap-2">
                <label className="font-bold text-xs text-gray-900 dark:text-white whitespace-nowrap">
                  Codigo del Cobro
                </label>
                <select
                  value={cobradorSeleccionado}
                  onChange={(e) => setCobradorSeleccionado(e.target.value)}
                  className="border-2 border-blue-600 dark:text-white dark:border-blue-400 min-w-[150px]
                  bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                  disabled={cargando}
                >
                  <option value="">Seleccionar código</option>
                  {cobradores.map((cobrador) => (
                    <option key={cobrador.cobCodigo} value={cobrador.cobCodigo}>
                      {cobrador.cobCodigo} - {cobrador.cobNombre}
                    </option>
                  ))}
                </select>

                {cargando && (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Cargando...
                  </span>
                )}
              </div>

              {/* Fila 2: Datos del Cliente */}
              <div className="mb-2 grid grid-cols-12 gap-2">
                {/* Cedula */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Cedula
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.cliCodigo || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Nombre Del Cliente */}
                <div className="col-span-3">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Nombre Del Cliente
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.cliNombre || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Dir - Tel */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.cliCalle || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Plazo (Dias) */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Plazo (Dias)
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.tarjetaActiva?.tiempo || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* FP */}
                <div className="col-span-1">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    FP
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.tarjetaActiva?.fp || ""}
                    readOnly
                    className="border-2 border-gray-300 dark:text-white dark:border-blue-400 w-full
                    bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Dias Vencidos */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Dias Vencidos
                  </label>
                  <input
                    type="text"
                    value={
                      clienteActual?.tarjetaActiva
                        ? calcularDiasVencidos(
                            clienteActual.tarjetaActiva.tarFecha
                          )
                        : 0
                    }
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-15 bg-yellow-300
                    dark:bg-yellow-500 px-1 py-0.5 text-xs text-center"
                  />
                </div>
              </div>

              {/* Fila 3: Valores (Valor, Cuota, Fecha, Saldo) */}
              <div className="mb-2 grid grid-cols-12 gap-2">
                {/* Valor */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.tarjetaActiva?.tarValor || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Cuota */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Cuota
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.tarjetaActiva?.tarCuota || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Fecha */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Fecha <span className="italic">( dd-mm-aa )</span>
                  </label>
                  <input
                    type="text"
                    value={
                      clienteActual?.tarjetaActiva
                        ? formatFecha(clienteActual.tarjetaActiva.tarFecha)
                        : ""
                    }
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Saldo */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Saldo
                  </label>
                  <input
                    type="text"
                    value={clienteActual?.saldoTotal || ""}
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-32 bg-green-300
                    dark:bg-green-600 px-1 py-0.5 text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* SECCIÓN PRINCIPAL: Checkboxes y Tabla de Descripción */}
              <div className="mb-2 flex-1 flex gap-2 overflow-hidden">
                {/* Panel de checkboxes (izquierda) */}
                <div className="bg-gray-100 dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500 p-3 w-64 flex flex-col justify-center">
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">
                        Colocar Fecha del sistema
                      </span>
                    </label>
                  </div>
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">
                        Descontar de la suma del cobro
                      </span>
                    </label>
                  </div>
                  <div className="mb-0.5">
                    <label className="items-center text-xs text-gray-900 flex dark:text-white">
                      <input type="checkbox" className="mr-1" />
                      <span className="font-bold">
                        Crear Prestamo Sin Sumar a Prest.
                      </span>
                    </label>
                  </div>
                  {/* Sección de Radio Buttons para Nuevo Cliente */}
                  <div className="bg-gray-200 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 p-3 mt-3">
                    <div className="font-bold text-xs mb-0.5 text-gray-900 dark:text-white">
                      Nuevo Cliente
                    </div>
                    <div className="mb-0.5">
                      <label className="items-center text-xs text-gray-600 flex dark:text-gray-300">
                        <input name="cliente" type="radio" className="mr-1" />
                        <span>Antes</span>
                      </label>
                    </div>
                    <div>
                      <label className="items-center text-xs text-gray-600 flex dark:text-gray-300">
                        <input name="cliente" type="radio" className="mr-1" />
                        <span>Despues</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tabla de descripción (derecha) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-center font-bold text-xs mb-1 text-gray-900 dark:text-white">
                    DESCRIPCION DE ABONOS
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs border border-gray-800 dark:border-gray-500">
                      <thead>
                        <tr className="bg-white dark:bg-gray-600">
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5">
                            Fecha Actual/Abono
                          </th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/6">
                            FECHA
                          </th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5">
                            ABONO
                          </th>
                          <th className="px-1 py-0.5 text-gray-900 border border-gray-800 dark:border-gray-500 dark:text-white w-1/5">
                            RESTA
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white dark:bg-gray-600">
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                            -
                          </td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                            -
                          </td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                            -
                          </td>
                          <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                            -
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Fila de Botones Inferiores */}
              <div className="justify-end flex flex-col">
                {/* Fila superior de botones */}
                <div className="mb-0.5 flex gap-1">
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                    onClick={handleAbonoSubmit}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Nuevo Cliente
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Abono
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Modificar
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                    onClick={() => navigate("/")}
                  >
                    Salir
                  </button>
                </div>
                {/* Fila inferior de botones de navegación */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
                    onClick={() =>
                      cobradorSeleccionado &&
                      cargarPrimerCliente(cobradorSeleccionado)
                    }
                    disabled={!cobradorSeleccionado || cargando}
                  >
                    Primero
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
                    onClick={() => navegarCliente("anterior")}
                    disabled={!clienteActual || cargando}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
                    onClick={() => navegarCliente("siguiente")}
                    disabled={!clienteActual || cargando}
                  >
                    Siguiente
                  </button>
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Ultimo
                  </button>
                  <Link
                    to="/"
                    className="flex-1 flex items-center justify-center border-2 border-blue-500 text-blue-500 
                    hover:text-white hover:bg-blue-500 bg-white px-2 py-0.5 text-xs transition duration-300"
                  >
                    Volver al Menú
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha (Información Adicional) - 3 de 12 columnas */}
          <div className="col-span-3 flex flex-col overflow-hidden gap-1">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow">
              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-5">
                  COBRO
                </label>
                <input
                  type="text"
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - PRESTAMO
                </label>
                <input
                  type="text"
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - GASTOS
                </label>
                <div className="flex gap-0.5 col-span-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white w-24 bg-white
                dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                  <label className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    Otr Gas
                  </label>
                  <input
                    type="text"
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-20 bg-white
                dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  + BASE
                </label>
                <input
                  type="text"
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - DESCUENTO
                </label>
                <input
                  type="text"
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-5">
                  Efectivo
                </label>
                <input
                  type="text"
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2"
                />
              </div>

              <div className="items-center flex gap-1">
                <div className="bg-green-500 dark:bg-green-600 px-1 py-1 flex-1">
                  &nbsp;
                </div>
                <label className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                  Diferencia:
                </label>
                <div className="bg-yellow-300 dark:bg-yellow-500 px-1 py-1 flex-1">
                  &nbsp;
                </div>
              </div>
            </div>

            <div className="bg-blue-700 dark:bg-blue-800 text-white text-center px-1 py-1 text-xs font-bold dark:text-white whitespace-nowrap">
              Fecha
            </div>

            <div className="bg-red-600 dark:bg-red-700 text-white text-center py-1 font-bold text-xs rounded shadow">
              SIN GUARDAR
            </div>

            <div className="flex-1">
              <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
                TARJETAS CANCELADAS
              </div>
              <div className="bg-yellow-500 dark:bg-yellow-600 h-full"></div>
            </div>

            <div className="flex-1">
              <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
                PRESTAMOS INGRESADOS
              </div>
              <div className="bg-cyan-500 dark:bg-cyan-600 h-full"></div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow">
              <label className="text-xs font-bold mb-1 text-gray-900 block dark:text-white">
                Buscar
              </label>
              <select
                className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-1 py-0.5 text-xs mb-1"
              >
                <option>Seleccionar</option>
              </select>

              <div className="items-center mb-1 flex gap-1">
                <label className="text-xs font-bold text-gray-900 dark:text-white">
                  Cédula
                </label>
                <input
                  type="text"
                  className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white bg-white
              dark:bg-gray-600 px-1 py-0.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="border-2 border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-2 py-1 text-xs font-bold mb-1"
              >
                Verificar
              </button>

              <button
                type="submit"
                className="border-2 border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white
            dark:bg-gray-600 px-2 py-1 text-xs font-bold"
              >
                #Tarjeta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbonoForm;
