import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface Cliente {
  cliCodigo: number;
  cliNombre: string;
  cliCalle: string;
  estado: string;
  saldoTotal: number;
  tarjetaActiva: {
    tarCodigo: string;
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

interface Descripcion {
  fechaAct: string;
  desFecha: string;
  desAbono: number;
  desResta: number;
  id: number;
}

const AbonoForm: React.FC = () => {
  // Estados
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [cobradorSeleccionado, setCobradorSeleccionado] = useState<string>("");
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [descripcionAbonos, setDescripcionAbonos] = useState<Descripcion[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [mostrarInputsAbono, setMostrarInputsAbono] = useState(false);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [saldoEscrito, setSaldoEscrito] = useState<number | "">("");
  const [saldoCalculado, setSaldoCalculado] = useState(0);

  const [abonoVisitado, setAbonoVisitado] = useState(false);

  const abonoInputRef = useRef<HTMLInputElement>(null);
  const saldoInputRef = useRef<HTMLInputElement>(null);

  const [posicionCliente, setPosicionCliente] = useState<number | null>(null);
  const [totalClientes, setTotalClientes] = useState<number>(0);

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

  // Funciones para cargar datos desde la API
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

  // Cargar el primer cliente para un cobrador dado
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

  // Navegar entre clientes
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

  const formatFecha = (fechaISO: string) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = String(fecha.getFullYear()).slice(-2);
    return `${dia}-${mes}-${año}`;
  };

  //cargar descripciones de abonos para el cliente actual
  useEffect(() => {
    if (clienteActual?.cliCodigo) {
      cargarDescripcionAbonos(clienteActual.cliCodigo);
    } else {
      setDescripcionAbonos([]);
    }
  }, [clienteActual]);

  // Función para cargar descripciones
  const cargarDescripcionAbonos = async (cliCodigo: number) => {
    try {
      const tarjetaResponse = await fetch(
        `http://localhost:3000/descripciones/cliente/${cliCodigo}/activa`
      );
      if (!tarjetaResponse.ok)
        throw new Error("Error al obtener la tarjeta activa");

      const data = await tarjetaResponse.json();

      if (data?.tarjetaActiva?.descripciones) {
        setDescripcionAbonos(data.tarjetaActiva.descripciones);
      } else {
        console.warn("⚠️ No se encontraron descripciones");
        setDescripcionAbonos([]);
      }
    } catch (error) {
      console.error("Error cargando descripciones:", error);
      setDescripcionAbonos([]);
    }
  };

  const calcularDiasVencidos = (fechaInicio: string, plazo: number) => {
    if (!fechaInicio || !plazo) return 0;

    const inicio = new Date(fechaInicio);
    const fechaVencimiento = new Date(inicio);
    fechaVencimiento.setDate(inicio.getDate() + plazo);

    const hoy = new Date();
    const diferencia = hoy.getTime() - fechaVencimiento.getTime();

    const dias = Math.floor(diferencia / (1000 * 3600 * 24));
    return dias > 0 ? dias : 0; // Si aún no vence → 0 días vencidos
  };

  const saldoActual =
    descripcionAbonos.length > 0
      ? descripcionAbonos[descripcionAbonos.length - 1].desResta
      : clienteActual?.tarjetaActiva?.saldoActual || 0;

  // Función para manejar el envío del formulario de abono
  const handleAbonoChange = (value: string) => {
    const abono = parseInt(value) || "";
    setMontoAbono(abono);
    const abonoNumber = typeof abono === "number" ? abono : 0;
    setSaldoCalculado(saldoActual - abonoNumber);
  };

  const procesarAbono = async () => {
    if (
      !clienteActual?.tarjetaActiva?.tarCodigo ||
      montoAbono === "" ||
      saldoEscrito === ""
    ) {
      alert("⚠️ Datos incompletos");
      return;
    }

    const abono = Number(montoAbono);
    const saldo = Number(saldoEscrito);

    // Validar que sean enteros
    if (!Number.isInteger(abono) || !Number.isInteger(saldo)) {
      alert("❌ Los montos deben ser números enteros");
      return;
    }

    // Validar cálculo local (opcional, backend también valida)
    if (saldoActual - abono !== saldo) {
      alert("❌ El saldo no coincide con la resta");
      return;
    }

    const payload = {
      tarCodigo: clienteActual.tarjetaActiva.tarCodigo, // ← ¡CRUCIAL!
      desAbono: abono,
      desResta: saldo,
      // fechaAct y desFecha: el backend las asigna si no vienen
    };

    try {
      const response = await fetch("http://localhost:3000/descripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al guardar el abono");
      }

      // ✅ Recargar descripciones y avanzar
      await cargarDescripcionAbonos(clienteActual.cliCodigo);
      await navegarCliente("siguiente");

      // Reset
      setMontoAbono("");
      setSaldoEscrito("");
      abonoInputRef.current?.focus();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`❌ ${error.message || "Error al guardar el abono"}`);
    }
  };

  const handleAbonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setAbonoVisitado(true); // ✅ Marca que el usuario entró al flujo
      saldoInputRef.current?.focus();
    }
  };

  const handleSaldoKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // ✅ Lógica del "doble Enter": ambos campos vacíos
      if (abonoVisitado && montoAbono === "" && saldoEscrito === "") {
        // Limpiar estado y avanzar
        setAbonoVisitado(false);
        setMontoAbono("");
        setSaldoEscrito("");
        await navegarCliente("siguiente");
        abonoInputRef.current?.focus(); // Volver a enfocar el abono para el próximo cliente
        return;
      }

      // Si no es doble Enter, procesar abono normal
      await procesarAbono();
    }
  };

  // Reiniciar el estado del abono cuando cambie el cliente
  useEffect(() => {
    setMontoAbono("");
    setSaldoEscrito("");
    setAbonoVisitado(false);
    abonoInputRef.current?.focus();
  }, [clienteActual]);

  const cargarPosicionCliente = async (
    cobCodigo: string,
    cliCodigoActual: number
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3000/clientes/cobrador/${cobCodigo}/todos`
      );
      if (!response.ok) throw new Error("Error al cargar la lista de clientes");

      const clientes: Cliente[] = await response.json();
      setTotalClientes(clientes.length);

      const indice = clientes.findIndex(
        (cliente) => cliente.cliCodigo === cliCodigoActual
      );
      setPosicionCliente(indice !== -1 ? indice + 1 : null);
    } catch (err: any) {
      console.error("Error al cargar posición del cliente:", err);
      setPosicionCliente(null);
      setTotalClientes(0);
    }
  };

  useEffect(() => {
    if (clienteActual && cobradorSeleccionado) {
      cargarPosicionCliente(cobradorSeleccionado, clienteActual.cliCodigo);
    } else {
      setPosicionCliente(null);
      setTotalClientes(0);
    }
  }, [clienteActual, cobradorSeleccionado]);

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
                            clienteActual.tarjetaActiva.tarFecha,
                            clienteActual.tarjetaActiva.tiempo
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
                        {descripcionAbonos.length > 0 ? (
                          descripcionAbonos.map((desc, index) => (
                            <tr
                              key={index}
                              className="bg-white dark:bg-gray-600"
                            >
                              <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                                {formatFecha(desc.fechaAct)}
                              </td>
                              <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                                {formatFecha(desc.desFecha)}
                              </td>
                              <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                                {Number(desc.desAbono)}
                              </td>
                              <td className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center">
                                {Number(desc.desResta)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-1 py-0.5 border border-gray-800 dark:border-gray-500 dark:text-white text-center"
                            >
                              No hay abonos registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Fila de Botones Inferiores */}
              <div className="justify-end flex flex-col">
                {/* Inputs de abono (si están visibles) */}
                {mostrarInputsAbono && (
                  <div className="flex gap-2 items-center mb-3 ml-65 justify-center">
                    <input
                      ref={abonoInputRef}
                      type="number"
                      placeholder="Abono"
                      value={montoAbono}
                      onChange={(e) => handleAbonoChange(e.target.value)}
                      onKeyDown={handleAbonoKeyDown}
                      className="border border-gray-600 p-1 w-20 text-center bg-yellow-200 font-bold"
                    />
                    <input
                      ref={saldoInputRef}
                      type="number"
                      placeholder="Saldo"
                      value={saldoEscrito}
                      onChange={(e) =>
                        setSaldoEscrito(parseInt(e.target.value) || "")
                      }
                      onKeyDown={handleSaldoKeyDown}
                      className="border border-gray-600 p-1 w-20 text-center bg-green-200 font-bold"
                    />
                    <span className="text-xl dark:text-white">
                      = {saldoCalculado}
                    </span>
                  </div>
                )}
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
                    onClick={() => setMostrarInputsAbono(!mostrarInputsAbono)}
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
                  <div className="flex-1 flex items-center justify-center text-xl font-bold text-gray-800 dark:text-gray-200 -mt-1">
                    {posicionCliente !== null
                      ? `${posicionCliente} / ${totalClientes}`
                      : "- / -"}
                  </div>
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
