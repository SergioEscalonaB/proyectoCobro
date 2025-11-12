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

const getDiasPorFrecuencia = (fp: string): number => {
  switch (fp.toLowerCase()) {
    case "diario":
      return 1;
    case "semanal":
      return 7;
    case "quincenal":
      return 15;
    case "mensual":
      return 30;
    default:
      return 1;
  }
};

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
  const [abonoVisitado, setAbonoVisitado] = useState(false);
  const abonoInputRef = useRef<HTMLInputElement>(null);
  const saldoInputRef = useRef<HTMLInputElement>(null);

  const [posicionCliente, setPosicionCliente] = useState<number | null>(null);
  const [totalClientes, setTotalClientes] = useState<number>(0);

  const [modoNuevoCliente, setModoNuevoCliente] = useState<"antes" | "despues">(
    "antes"
  );
  const [editandoNuevoCliente, setEditandoNuevoCliente] = useState(false);
  // Campos editables para el nuevo cliente
  const [nuevoClienteData, setNuevoClienteData] = useState({
    cliCodigo: "",
    cliNombre: "",
    cliCalle: "",
    tarValor: "",
    tiempo: "",
    fp: "Diario", // valor por defecto
    tarFecha: "",
  });

  const [modoModificacion, setModoModificacion] = useState(false);
  const [datosModificacion, setDatosModificacion] = useState({
    cliNombre: "",
    cliCalle: "",
    tiempo: "",
    fp: "Diario",
  });

  const [clientesExistentes, setClientesExistentes] = useState<Cliente[]>([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  const cargarClientesExistentes = async () => {
    try {
      const response = await fetch("http://localhost:3000/clientes");
      console.log(
        "Respuesta del backend:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos:", data); // 👈 Esto te mostrará qué está llegando

      setClientesExistentes(data);
    } catch (err: any) {
      console.error("Error cargando clientes existentes:", err);
      setError(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    cargarCobradores();
    cargarClientesExistentes(); // 🔥 Cargar clientes existentes
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

  const handleGuardarNuevoCliente = async () => {
    if (!cobradorSeleccionado) {
      alert("Seleccione un cobrador primero");
      return;
    }

    // Validar campos obligatorios
    const { cliCodigo, cliNombre, cliCalle, tarValor, tiempo, fp, tarFecha } =
      nuevoClienteData;
    if (!cliCodigo || !cliNombre || !tarValor || !tiempo || !tarFecha) {
      alert("Complete todos los campos obligatorios");
      return;
    }

    const valor = Number(tarValor);
    const plazo = Number(tiempo);
    if (isNaN(valor) || isNaN(plazo) || valor <= 0 || plazo <= 0) {
      alert("Valor y plazo deben ser números válidos mayores a 0");
      return;
    }

    const diasPorCuota = getDiasPorFrecuencia(fp);
    const numCuotas = Math.ceil(plazo / diasPorCuota);
    const cuota = Math.floor(Math.ceil(valor / numCuotas));

    // Convertir fecha corta a ISO
    const fechaISO = convertirFechaCortaAISO(tarFecha);
    if (!fechaISO) {
      alert("Formato de fecha inválido. Use dd-mm-aa (ej: 15-04-25)");
      return;
    }

    const payload = {
      cliCodigo,
      cliNombre,
      cliCalle,
      tarValor: valor,
      tarCuota: cuota,
      tiempo: plazo,
      fp: fp, //
      tarFecha: fechaISO,
      cobCodigo: cobradorSeleccionado,
    };

    try {
      setCargando(true);
      setError("");

      // Construir URL: con o sin referencia
      let url = "http://localhost:3000/clientes";
      if (clienteActual?.tarjetaActiva?.iten) {
        // Solo si tiene tarjeta activa
        const queryParams = new URLSearchParams({
          referencia: clienteActual.tarjetaActiva.iten.toString(), // ← ITEN, no cliCodigo!
          modo: modoNuevoCliente,
        }).toString();
        url += `?${queryParams}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear el cliente");
      }

      alert("✅ Cliente creado exitosamente");
      setEditandoNuevoCliente(false);
      setNuevoClienteData({
        cliCodigo: "",
        cliNombre: "",
        cliCalle: "",
        tarValor: "",
        tiempo: "",
        fp: "Diario",
        tarFecha: "",
      });

      // Recargar la lista
      // Recargar el cliente recién creado por su cédula
      try {
        const response = await fetch(
          `http://localhost:3000/clientes/${cliCodigo}`
        );
        if (response.ok) {
          const clienteCreado = await response.json();
          setClienteActual(clienteCreado);
          setError("");
        } else {
          // Si no existe aún, ir al primero (por seguridad)
          await cargarPrimerCliente(cobradorSeleccionado);
        }
      } catch (err) {
        console.error("Error al cargar cliente recién creado:", err);
        await cargarPrimerCliente(cobradorSeleccionado);
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const convertirFechaCortaAISO = (fechaCorta: string): string | null => {
    // Ej: "15-04-25" → "2025-04-15"
    const partes = fechaCorta.split("-");
    if (partes.length !== 3) return null;
    const [dd, mm, aa] = partes;
    if (
      !dd ||
      !mm ||
      !aa ||
      dd.length !== 2 ||
      mm.length !== 2 ||
      aa.length !== 2
    )
      return null;

    // Suponemos siglo 2000-2099
    const año = parseInt(aa, 10) + 2000;
    const mes = parseInt(mm, 10);
    const dia = parseInt(dd, 10);

    // Validación básica
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

    return `${año}-${mm}-${dd}`;
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

  const saldoCalculado =
    typeof montoAbono === "number" ? saldoActual - montoAbono : saldoActual;

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

  const iniciarModificacion = () => {
    if (!clienteActual?.tarjetaActiva) {
      alert("No hay cliente activo para modificar");
      return;
    }
    setModoModificacion(true);
    setDatosModificacion({
      cliNombre: clienteActual.cliNombre,
      cliCalle: clienteActual.cliCalle,
      tiempo: clienteActual.tarjetaActiva.tiempo.toString(),
      fp: clienteActual.tarjetaActiva.fp || "Diario",
    });
  };

  const guardarModificacion = async () => {
    const { cliNombre, cliCalle, tiempo, fp } = datosModificacion;
    const plazo = Number(tiempo);
    if (!cliNombre || !cliCalle || isNaN(plazo) || plazo <= 0) {
      alert("Complete todos los campos correctamente.");
      return;
    }

    const valor = clienteActual!.tarjetaActiva!.tarValor;
    const diasPorCuota = getDiasPorFrecuencia(fp);
    const numCuotas = Math.ceil(plazo / diasPorCuota);
    const tarCuota = Math.ceil(valor / numCuotas);

    try {
      setCargando(true);
      const response = await fetch(
        `http://localhost:3000/clientes/${clienteActual!.cliCodigo}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliNombre,
            cliCalle,
            tiempo: plazo,
            fp,
            tarCuota,
          }),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar el cliente");

      alert("✅ Cliente actualizado correctamente");
      // Recargar cliente
      const res = await fetch(
        `http://localhost:3000/clientes/${clienteActual!.cliCodigo}`
      );
      if (res.ok) {
        const cliente = await res.json();
        setClienteActual(cliente);
      }
      setModoModificacion(false);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const cancelarOperacion = () => {
    setEditandoNuevoCliente(false);
    setModoModificacion(false);
    setMostrarListaClientes(false);
    // No se reinicia nuevoClienteData porque no se usa en modo modificación
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
                  {editandoNuevoCliente ? (
                    <input
                      type="text"
                      value={nuevoClienteData.cliCodigo}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setNuevoClienteData({
                            ...nuevoClienteData,
                            cliCodigo: "",
                          });
                        } else {
                          // Solo permite dígitos
                          const onlyDigits = val.replace(/\D/g, "");
                          setNuevoClienteData({
                            ...nuevoClienteData,
                            cliCodigo: onlyDigits,
                          });
                        }
                      }}
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.cliCodigo || ""}
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>
                {/* Nombre Del Cliente */}
                <div className="col-span-3 flex flex-col">
                  {/* 🔹 Label + Checkbox (solo si editandoNuevoCliente) */}
                  <div className="flex items-center justify-left mb-1">
                    <label className="font-bold text-xs text-gray-900 dark:text-white">
                      Nombre Del Cliente
                    </label>

                    {editandoNuevoCliente && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="clienteExistente"
                          className="ml-5"
                          checked={mostrarListaClientes}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setMostrarListaClientes(checked);
                            if (checked) {
                              setNuevoClienteData({
                                cliCodigo: "",
                                cliNombre: "",
                                cliCalle: "",
                                tarValor: "",
                                tiempo: "",
                                fp: "Diario",
                                tarFecha: "",
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor="clienteExistente"
                          className="text-xs font-bold text-gray-800 dark:text-gray-200"
                        >
                          Existente
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 🔹 Input o Select */}
                  {editandoNuevoCliente ? (
                    <div className="flex flex-col gap-1">
                      {!mostrarListaClientes && (
                        <input
                          type="text"
                          value={nuevoClienteData.cliNombre}
                          onChange={(e) =>
                            setNuevoClienteData({
                              ...nuevoClienteData,
                              cliNombre: e.target.value,
                            })
                          }
                          className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                        />
                      )}

                      {mostrarListaClientes && (
                        <select
                          value={nuevoClienteData.cliCodigo}
                          onChange={(e) => {
                            const cliCodigo = e.target.value;
                            const cliente = clientesExistentes.find(
                              (c) => c.cliCodigo.toString() === cliCodigo
                            );
                            if (cliente) {
                              setNuevoClienteData({
                                cliCodigo: cliente.cliCodigo.toString(),
                                cliNombre: cliente.cliNombre,
                                cliCalle: cliente.cliCalle,
                                tarValor: "",
                                tiempo: "",
                                fp: "Diario",
                                tarFecha: "",
                              });
                            } else {
                              setNuevoClienteData({
                                cliCodigo: "",
                                cliNombre: "",
                                cliCalle: "",
                                tarValor: "",
                                tiempo: "",
                                fp: "Diario",
                                tarFecha: "",
                              });
                            }
                          }}
                          className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                        >
                          <option value="">Seleccionar cliente...</option>
                          {clientesExistentes.map((cliente) => (
                            <option
                              key={cliente.cliCodigo}
                              value={cliente.cliCodigo}
                            >
                              {cliente.cliNombre} ({cliente.cliCodigo})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : modoModificacion ? (
                    <input
                      type="text"
                      value={datosModificacion.cliNombre}
                      onChange={(e) =>
                        setDatosModificacion({
                          ...datosModificacion,
                          cliNombre: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white flex-1 bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.cliNombre || ""}
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white flex-1 bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>

                {/* Dir - Tel */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Dirección
                  </label>
                  {editandoNuevoCliente ? (
                    <input
                      type="text"
                      value={nuevoClienteData.cliCalle}
                      onChange={(e) =>
                        setNuevoClienteData({
                          ...nuevoClienteData,
                          cliCalle: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : modoModificacion ? (
                    <input
                      type="text"
                      value={datosModificacion.cliCalle}
                      onChange={(e) =>
                        setDatosModificacion({
                          ...datosModificacion,
                          cliCalle: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.cliCalle || ""}
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>
                {/* Plazo (Dias) */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Plazo (Dias)
                  </label>
                  {editandoNuevoCliente ? (
                    <input
                      type="number"
                      value={nuevoClienteData.tiempo}
                      onChange={(e) =>
                        setNuevoClienteData({
                          ...nuevoClienteData,
                          tiempo: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : modoModificacion ? (
                    <input
                      type="number"
                      value={datosModificacion.tiempo}
                      onChange={(e) =>
                        setDatosModificacion({
                          ...datosModificacion,
                          tiempo: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.tarjetaActiva?.tiempo || ""}
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>
                {/* FP */}
                <div className="col-span-1">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    FP
                  </label>
                  {editandoNuevoCliente ? (
                    <select
                      value={nuevoClienteData.fp}
                      onChange={(e) =>
                        setNuevoClienteData({
                          ...nuevoClienteData,
                          fp: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    >
                      <option value="Diario">DIARIO</option>
                      <option value="Semanal">SEMANAL</option>
                      <option value="Quincenal">QUINCENAL</option>
                      <option value="Mensual">MENSUAL</option>
                    </select>
                  ) : modoModificacion ? (
                    <select
                      value={datosModificacion.fp}
                      onChange={(e) =>
                        setDatosModificacion({
                          ...datosModificacion,
                          fp: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    >
                      <option value="Diario">DIARIO</option>
                      <option value="Semanal">SEMANAL</option>
                      <option value="Quincenal">QUINCENAL</option>
                      <option value="Mensual">MENSUAL</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.tarjetaActiva?.fp || ""}
                      readOnly
                      className="border-2 border-gray-300 dark:text-white dark:border-blue-400 w-full bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
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
                  {editandoNuevoCliente ? (
                    <input
                      type="number"
                      value={nuevoClienteData.tarValor}
                      onChange={(e) =>
                        setNuevoClienteData({
                          ...nuevoClienteData,
                          tarValor: e.target.value,
                        })
                      }
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={clienteActual?.tarjetaActiva?.tarValor || ""}
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100
                    dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>
                {/* Cuota */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Cuota
                  </label>
                  <input
                    type="text"
                    value={
                      editandoNuevoCliente &&
                      nuevoClienteData.tarValor &&
                      nuevoClienteData.tiempo
                        ? (() => {
                            const valor = Number(nuevoClienteData.tarValor);
                            const plazo = Number(nuevoClienteData.tiempo);
                            const fp = nuevoClienteData.fp;
                            if (isNaN(valor) || isNaN(plazo) || plazo <= 0)
                              return "";
                            const diasPorCuota = getDiasPorFrecuencia(fp);
                            const numCuotas = Math.ceil(plazo / diasPorCuota);
                            return Math.ceil(valor / numCuotas);
                          })()
                        : modoModificacion &&
                          clienteActual?.tarjetaActiva?.tarValor
                        ? (() => {
                            const valor = clienteActual.tarjetaActiva.tarValor;
                            const plazo = Number(datosModificacion.tiempo);
                            const fp = datosModificacion.fp;
                            if (isNaN(plazo) || plazo <= 0) return "";
                            const diasPorCuota = getDiasPorFrecuencia(fp);
                            const numCuotas = Math.ceil(plazo / diasPorCuota);
                            return Math.ceil(valor / numCuotas);
                          })()
                        : clienteActual?.tarjetaActiva?.tarCuota || ""
                    }
                    readOnly
                    className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                  />
                </div>
                {/* Fecha */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Fecha <span className="italic">( dd-mm-aa )</span>
                  </label>
                  {editandoNuevoCliente ? (
                    <input
                      type="text"
                      value={nuevoClienteData.tarFecha}
                      onChange={(e) => {
                        let value = e.target.value;

                        // Eliminar todo lo que no sea número
                        value = value.replace(/\D/g, "");

                        // Aplicar límite de 6 dígitos
                        if (value.length > 6) {
                          value = value.slice(0, 6);
                        }

                        // Formatear como dd-mm-aa SOLO si tiene suficientes dígitos
                        let formatted = value;
                        if (value.length > 2) {
                          formatted = value.slice(0, 2) + "-" + value.slice(2);
                        }
                        if (value.length > 4) {
                          formatted =
                            value.slice(0, 2) +
                            "-" +
                            value.slice(2, 4) +
                            "-" +
                            value.slice(4);
                        }

                        setNuevoClienteData({
                          ...nuevoClienteData,
                          tarFecha: formatted,
                        });
                      }}
                      placeholder="dd-mm-aa"
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      value={
                        clienteActual?.tarjetaActiva
                          ? formatFecha(clienteActual.tarjetaActiva.tarFecha)
                          : ""
                      }
                      readOnly
                      className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-gray-100 dark:bg-gray-600 px-1 py-0.5 text-xs"
                    />
                  )}
                </div>
                {/* Saldo */}
                <div className="col-span-2">
                  <label className="font-bold text-xs mb-0.5 text-gray-900 block dark:text-white">
                    Saldo
                  </label>
                  <input
                    type="text"
                    value={saldoActual}
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
                        <input
                          type="radio"
                          className="mr-1"
                          name="posicion-nuevo"
                          checked={modoNuevoCliente === "antes"}
                          onChange={() => setModoNuevoCliente("antes")}
                        />
                        <span>Antes</span>
                      </label>
                    </div>
                    <div>
                      <label className="items-center text-xs text-gray-600 flex dark:text-gray-300">
                        <input
                          type="radio"
                          className="mr-1"
                          name="posicion-nuevo"
                          checked={modoNuevoCliente === "despues"}
                          onChange={() => setModoNuevoCliente("despues")}
                        />
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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setMontoAbono("");
                        } else {
                          const num = parseInt(value, 10);
                          setMontoAbono(isNaN(num) ? "" : num);
                        }
                      }}
                      onKeyDown={handleAbonoKeyDown}
                      className="border border-gray-600 p-1 w-20 text-center bg-yellow-200 font-bold"
                    />
                    <input
                      ref={saldoInputRef}
                      type="number"
                      placeholder="Saldo"
                      value={saldoEscrito}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setSaldoEscrito("");
                        } else {
                          const num = parseFloat(value);
                          setSaldoEscrito(isNaN(num) ? "" : num);
                        }
                      }}
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
                    onClick={cancelarOperacion}
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={
                      modoModificacion
                        ? guardarModificacion
                        : handleGuardarNuevoCliente
                    }
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoNuevoCliente(true);
                      setModoModificacion(false);
                    }}
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors"
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
                    onClick={iniciarModificacion}
                    disabled={!clienteActual}
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
