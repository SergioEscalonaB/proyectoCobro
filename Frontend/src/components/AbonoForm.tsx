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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [cobradores, setCobradores] = useState<Cobrador[]>([]); // Lista de cobradores
  const [cobradorSeleccionado, setCobradorSeleccionado] = useState<string>(""); // Código del cobrador seleccionado
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null); // Cliente actual
  const [descripcionAbonos, setDescripcionAbonos] = useState<Descripcion[]>([]);
  const [cargando, setCargando] = useState<boolean>(false); // Estado de carga
  const [error, setError] = useState<string>(""); // Mensaje de error
  const [mostrarInputsAbono, setMostrarInputsAbono] = useState(false); // Mostrar inputs de abono
  const [montoAbono, setMontoAbono] = useState<number | "">(""); // Monto del abono
  const [saldoEscrito, setSaldoEscrito] = useState<number | "">(""); // Saldo escrito
  const [abonoVisitado, setAbonoVisitado] = useState(false); // Marca si el usuario entró al flujo de abono
  const abonoInputRef = useRef<HTMLInputElement>(null); // Ref para el input de abono
  const saldoInputRef = useRef<HTMLInputElement>(null); // Ref para el input de saldo
  const [posicionCliente, setPosicionCliente] = useState<number | null>(null); // Posición del cliente actual dentro de la lista
  const [totalClientes, setTotalClientes] = useState<number>(0); // Total de clientes del cobrador
  const [modoNuevoCliente, setModoNuevoCliente] = useState<"antes" | "despues">(
    "antes"
  ); // Modo de nuevo cliente
  const [editandoNuevoCliente, setEditandoNuevoCliente] = useState(false);
  const [nuevoClienteData, setNuevoClienteData] = useState({
    cliCodigo: "",
    cliNombre: "",
    cliCalle: "",
    tarValor: "",
    tiempo: "",
    fp: "Diario", // valor por defecto
    tarFecha: "",
  }); // Datos para el nuevo cliente

  const [modoModificacion, setModoModificacion] = useState(false); // Modo de modificación
  const [datosModificacion, setDatosModificacion] = useState({
    cliNombre: "",
    cliCalle: "",
    tiempo: "",
    fp: "Diario",
  }); // Datos para modificación

  const [clientesExistentes, setClientesExistentes] = useState<Cliente[]>([]); // Lista de clientes existentes
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false); // Mostrar lista de clientes
  const [liquidacionActiva, setLiquidacionActiva] = useState(false); // Estado de liquidación activa

  // Estados para cálculo de liquidación
  const [totalAbonos, setTotalAbonos] = useState<number>(0);
  const [totalPrestamos, setTotalPrestamos] = useState<number>(0);
  const [gastos, setGastos] = useState<number>(0);
  const [otrGas, setOtrGas] = useState<number>(0);
  const [base, setBase] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [efectivoIngresado, setEfectivoIngresado] = useState<number>(0);
  const [abonoProcesando, setAbonoProcesando] = useState(false);
  const [guardado, setGuardado] = useState<boolean>(false);
  const [guardandoReporte, setGuardandoReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState<string | null>(null);

  const [estadoCargado, setEstadoCargado] = useState(false); // Marca si el estado ha sido cargado desde localStorage
  const [itenActual, setItenActual] = useState<number | null>(null); // Iten del cliente actual (para restaurar posición)
  const [tarjetasCanceladas, setTarjetasCanceladas] = useState<
    Array<{ nombre: string; ultimoAbono: number; diasVencidos: number }>
  >([]); // Tarjetas canceladas durante la liquidación
  const [prestamosIngresados, setPrestamosIngresados] = useState<
    Array<{ nombre: string; valorPrestamo: number }>
  >([]); // Préstamos ingresados durante la liquidación

  const cobro = totalAbonos; // total de abonos = cobro
  const prestamo = totalPrestamos; // total de nuevos préstamos

  const efectivoEsperado =
    cobro - prestamo - gastos - otrGas + base - descuento; // Efectivo que debería haber
  const diferencia = efectivoIngresado - efectivoEsperado; // Diferencia entre efectivo ingresado y esperado

  const cargarClientesExistentes = async () => {
    try {
      const response = await fetch(`${API_URL}/clientes`);
      console.log(
        "Respuesta del backend:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos:", data);

      setClientesExistentes(data);
    } catch (err: any) {
      console.error("Error cargando clientes existentes:", err);
      setError(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    cargarCobradores();
    cargarClientesExistentes(); //Cargar clientes existentes
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

      const response = await fetch(`${API_URL}/cobros`);

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
        `${API_URL}/clientes/cobrador/${cobCodigo}/primer-cliente`
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

  // Cargar el último cliente para un cobrador dado
  const cargarUltimoCliente = async (cobCodigo: string) => {
    try {
      setCargando(true);
      const response = await fetch(
        `${API_URL}/clientes/cobrador/${cobCodigo}/ultimo-cliente`
      );

      if (!response.ok) throw new Error("No se pudo cargar el último cliente");

      const cliente = await response.json();
      setClienteActual(cliente);
      setError("");
    } catch (err: any) {
      setError(err.message);
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
        `${API_URL}/clientes/cobrador/${cobradorSeleccionado}/navegar?iten=${itenActual}&direccion=${direccion}`
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

  // Formatear fecha ISO a dd-mm-aa
  const formatFecha = (fechaISO: string) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = String(fecha.getFullYear()).slice(-2);
    return `${dia}-${mes}-${año}`;
  };

  // Guardar nuevo cliente
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
    const cuota = Math.ceil(valor / numCuotas); // redondeo arriba para que sea entero

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
      fp,
      tarFecha: fechaISO,
      cobCodigo: cobradorSeleccionado,
    };

    try {
      setCargando(true);
      setError("");

      // Crear cliente
      let url = `${API_URL}/clientes`;
      if (clienteActual?.tarjetaActiva?.iten) {
        const queryParams = new URLSearchParams({
          referencia: clienteActual.tarjetaActiva.iten.toString(),
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

      // acumular préstamo para liquidación
      if (liquidacionActiva) {
        setTotalPrestamos((prev) => prev + valor);
      }

      // Registrar en "Préstamos Ingresados"
      if (liquidacionActiva) {
        setPrestamosIngresados((prev) => [
          ...prev,
          {
            nombre: cliNombre,
            valorPrestamo: valor,
          },
        ]);
      }

      alert("Cliente creado exitosamente");
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

      // Recargar cliente recién creado
      try {
        const res = await fetch(`${API_URL}/clientes/${cliCodigo}`);
        if (res.ok) {
          const clienteCreado = await res.json();
          setClienteActual(clienteCreado);
          setError("");
        } else {
          // Si no se encuentra, volver al primero
          await cargarPrimerCliente(cobradorSeleccionado);
        }
      } catch (err) {
        console.error("Error al recargar cliente recién creado:", err);
        await cargarPrimerCliente(cobradorSeleccionado);
      }
    } catch (err: any) {
      console.error("Error en handleGuardarNuevoCliente:", err);
      setError(` ${err.message || "Error al crear el cliente"}`);
      alert(`${err.message || "Error al crear el cliente"}`);
    } finally {
      setCargando(false);
    }
  };

  // Convertir fecha dd-mm-aa a ISO yyyy-mm-dd
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
        `${API_URL}/descripciones/cliente/${cliCodigo}/activa`
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

  // Calcular días vencidos
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

  // Calcular saldo actual de la tarjeta
  const saldoActual =
    descripcionAbonos.length > 0
      ? descripcionAbonos[descripcionAbonos.length - 1].desResta
      : clienteActual?.tarjetaActiva?.saldoActual || 0;

  // Calcular saldo después del abono
  const saldoCalculado =
    typeof montoAbono === "number" ? saldoActual - montoAbono : saldoActual;

  // Procesar abono
  const procesarAbono = async () => {
    if (abonoProcesando) return;
    setAbonoProcesando(true);

    try {
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

      // Validar cálculo local
      if (saldoActual - abono !== saldo) {
        alert("❌ El saldo no coincide con la resta");
        return;
      }

      // Construir payload para el abono
      const payload = {
        tarCodigo: clienteActual.tarjetaActiva.tarCodigo,
        desAbono: abono,
        desResta: saldo,
      };

      const response = await fetch(`${API_URL}/descripciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al guardar el abono");
      }

      if (liquidacionActiva) {
        setTotalAbonos((prev) => prev + abono);
      }

      // Registrar tarjeta cancelada
      if (liquidacionActiva && saldo <= 0 && clienteActual) {
        const diasVencidos = calcularDiasVencidos(
          clienteActual.tarjetaActiva.tarFecha,
          clienteActual.tarjetaActiva.tiempo
        );
        setTarjetasCanceladas((prev) => [
          ...prev,
          {
            nombre: clienteActual.cliNombre,
            ultimoAbono: abono,
            diasVencidos: diasVencidos,
          },
        ]);
      }

      await cargarDescripcionAbonos(clienteActual.cliCodigo);
      await navegarCliente("siguiente");

      setMontoAbono("");
      setSaldoEscrito("");
      abonoInputRef.current?.focus();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`❌ ${error.message || "Error al guardar el abono"}`);
    } finally {
      // IMPORTANTE liberar el candado SIEMPRE
      setAbonoProcesando(false);
    }
  };

  // Manejo de teclas Enter
  const handleAbonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setAbonoVisitado(true); //Marca que el usuario entró al flujo
      saldoInputRef.current?.focus();
    }
  };

  // Manejo de teclas Enter
  const handleSaldoKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Lógica del doble Enter: ambos campos vacíos
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
        `${API_URL}/clientes/cobrador/${cobCodigo}/todos`
      );
      if (!response.ok) throw new Error("Error al cargar la lista de clientes");
      const todosLosClientes: Cliente[] = await response.json();

      // 🔥 Filtrar solo los clientes activos (con tarjetaActiva)
      const clientesActivos = todosLosClientes.filter(
        (cliente) => cliente.tarjetaActiva !== null
      );

      // Establecer el total de clientes ACTIVOS
      setTotalClientes(clientesActivos.length);

      // Encontrar la posición del cliente actual DENTRO de la lista de clientes activos
      const indice = clientesActivos.findIndex(
        (cliente) => cliente.cliCodigo === cliCodigoActual
      );

      // Si el cliente actual es activo, su posición será >= 0. Si no, será -1.
      setPosicionCliente(indice !== -1 ? indice + 1 : null);
    } catch (err: any) {
      console.error("Error al cargar posición del cliente:", err);
      setPosicionCliente(null);
      setTotalClientes(0);
    }
  };

  // Cargar posición del cliente en la lista de clientes activos
  useEffect(() => {
    if (clienteActual && cobradorSeleccionado) {
      cargarPosicionCliente(cobradorSeleccionado, clienteActual.cliCodigo);
    } else {
      setPosicionCliente(null);
      setTotalClientes(0);
    }
  }, [clienteActual, cobradorSeleccionado]);

  // Iniciar modificación de cliente
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

  // Guardar modificaciones de cliente
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
        `${API_URL}/clientes/${clienteActual!.cliCodigo}`,
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

      alert("Cliente actualizado correctamente");
      // Recargar cliente
      const res = await fetch(
        `${API_URL}/clientes/${clienteActual!.cliCodigo}`
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

  // Finalizar liquidación boton
  const handleFinalizarLiquidacion = async () => {
    if (guardandoReporte) return;
    if (!liquidacionActiva) {
      alert("No hay una liquidación activa.");
      return;
    }

    // 1️⃣ Primera pregunta: finalizar liquidación
    const confirmarFinalizar = window.confirm(
      "¿Está seguro que desea finalizar la liquidación?"
    );

    if (!confirmarFinalizar) {
      return; // cancela todo
    }

    // 2️⃣ Segunda pregunta: guardar en la base de datos
    const deseaGuardar = window.confirm(
      "¿Desea guardar esta liquidación en la base de datos?"
    );

    // --- SI NO QUIERE GUARDAR ---
    if (!deseaGuardar) {
      // Cierra liquidación sin guardar
      setGuardado(true);
      setLiquidacionActiva(false);
      setMostrarInputsAbono(false);
      setEditandoNuevoCliente(false);
      setMostrarListaClientes(false);
      setModoModificacion(false);

      setNuevoClienteData({
        cliCodigo: "",
        cliNombre: "",
        cliCalle: "",
        tarValor: "",
        tiempo: "",
        fp: "Diario",
        tarFecha: "",
      });

      setDatosModificacion({
        cliNombre: "",
        cliCalle: "",
        tiempo: "",
        fp: "Diario",
      });

      alert("Liquidación finalizada sin guardar.");
      localStorage.removeItem("estado_liquidacion");
      return;
    }

    // --- SI QUIERE GUARDAR ---
    const payload = {
      cobCodigo: cobradorSeleccionado || "N/A",
      cobro: Number(totalAbonos || 0),
      prestamos: Number(totalPrestamos || 0),
      gastos: Number(gastos || 0),
      otrosGastos: Number(otrGas || 0),
      base: Number(base || 0),
      descuento: Number(descuento || 0),
      efectivo: Number(efectivoIngresado || 0),
      diferencia: Number(diferencia || 0),
      fecha: new Date().toISOString(),
    };

    try {
      setGuardandoReporte(true);
      setErrorReporte(null);

      const res = await fetch(`${API_URL}/reporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || `Error ${res.status}: ${res.statusText}`;
        throw new Error(msg);
      }

      const creado = await res.json();
      console.log("Reporte guardado:", creado);

      // Reset igual que antes
      setGuardado(true);
      setLiquidacionActiva(false);
      setMostrarInputsAbono(false);
      setEditandoNuevoCliente(false);
      setMostrarListaClientes(false);
      setModoModificacion(false);

      setNuevoClienteData({
        cliCodigo: "",
        cliNombre: "",
        cliCalle: "",
        tarValor: "",
        tiempo: "",
        fp: "Diario",
        tarFecha: "",
      });

      setDatosModificacion({
        cliNombre: "",
        cliCalle: "",
        tiempo: "",
        fp: "Diario",
      });

      alert("✅ Liquidación guardada exitosamente.");
    } catch (err: any) {
      console.error("Error guardando reporte:", err);
      setErrorReporte(err.message || "Error al guardar el reporte");
      alert(`❌ ${err.message || "Error al guardar el reporte"}`);
    } finally {
      setGuardandoReporte(false);
    }
  };

  useEffect(() => {
    if (clienteActual?.tarjetaActiva?.iten) {
      setItenActual(clienteActual.tarjetaActiva.iten);
    }
  }, [clienteActual]);

  //Guardar
  useEffect(() => {
    if (!estadoCargado) return;

    const estado = {
      liquidacionActiva,
      cobradorSeleccionado,
      itenActual,
      totalAbonos,
      totalPrestamos,
      gastos,
      otrGas,
      descuento,
      base,
      efectivoIngresado,
      diferencia,
      montoAbono,
      saldoEscrito,
      tarjetasCanceladas,
      prestamosIngresados,
    };

    localStorage.setItem("estado_liquidacion", JSON.stringify(estado));
  }, [
    estadoCargado,
    liquidacionActiva,
    cobradorSeleccionado,
    itenActual,
    totalAbonos,
    totalPrestamos,
    gastos,
    otrGas,
    descuento,
    base,
    efectivoIngresado,
    diferencia,
    montoAbono,
    saldoEscrito,
    tarjetasCanceladas,
    prestamosIngresados,
  ]);

  // Restaurar
  useEffect(() => {
    const data = localStorage.getItem("estado_liquidacion");
    if (!data) {
      setEstadoCargado(true);
      return;
    }

    try {
      const estado = JSON.parse(data);

      if (estado.liquidacionActiva) {
        setLiquidacionActiva(true);

        setCobradorSeleccionado(estado.cobradorSeleccionado || "");

        setTotalAbonos(estado.totalAbonos || 0);
        setTotalPrestamos(estado.totalPrestamos || 0);
        setGastos(estado.gastos || 0);
        setOtrGas(estado.otrGas || 0);
        setDescuento(estado.descuento || 0);
        setBase(estado.base || 0);
        setEfectivoIngresado(estado.efectivoIngresado || 0);
        setMontoAbono(estado.montoAbono || "");
        setSaldoEscrito(estado.saldoEscrito || "");
        setTarjetasCanceladas(estado.tarjetasCanceladas || []);
        setPrestamosIngresados(estado.prestamosIngresados || []);

        if (estado.itenActual && estado.cobradorSeleccionado) {
          //Recargar cliente exacto desde backend
          fetch(
            `${API_URL}/clientes/cobrador/${estado.cobradorSeleccionado}/navegar?iten=${estado.itenActual}&direccion=actual`
          )
            .then((res) => res.json())
            .then((cli) => {
              setClienteActual(cli);
            })
            .catch((err) => console.error("Error restaurando cliente:", err));
        }
      }
    } catch (err) {
      console.error("Error restaurando liquidación:", err);
    }

    setEstadoCargado(true);
  }, []);

  const fechaHoy = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Función para buscar y cargar un cliente por cédula, incluyendo su posición
  const buscarClientePorCodigo = async (cliCodigo: number) => {
    if (!cobradorSeleccionado) {
      alert("Primero seleccione un cobrador");
      return;
    }

    try {
      setCargando(true);
      setError("");

      // 1. Cargar el cliente por cédula
      const resCliente = await fetch(
        `${API_URL}/clientes/${cliCodigo}`
      );
      if (!resCliente.ok) throw new Error("Cliente no encontrado");
      const cliente = await resCliente.json();

      // 2. Verificar que pertenezca al cobrador seleccionado
      if (cliente.cobCodigo !== cobradorSeleccionado) {
        alert(`El cliente no pertenece al cobrador ${cobradorSeleccionado}`);
        return;
      }

      // 3. Cargar su posición en la lista del cobrador
      const resLista = await fetch(
        `${API_URL}/clientes/cobrador/${cobradorSeleccionado}/todos`
      );
      if (!resLista.ok) throw new Error("Error al cargar lista de clientes");
      const listaClientes: Cliente[] = await resLista.json();
      const clientesActivos = listaClientes.filter(
        (c) => c.tarjetaActiva !== null
      );
      const posicion = clientesActivos.findIndex(
        (c) => c.cliCodigo === cliCodigo
      );

      if (posicion === -1) {
        alert("El cliente no está activo en este cobrador");
        return;
      }

      setClienteActual(cliente);
      setPosicionCliente(posicion + 1);
      setTotalClientes(clientesActivos.length);
    } catch (err: any) {
      console.error("Error en búsqueda:", err);
      setError(`Cliente no encontrado o inactivo: ${err.message}`);
    } finally {
      setCargando(false);
    }
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
                  {/* Label + Checkbox (solo si editandoNuevoCliente) */}
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

                  {/* Input o Select  */}
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
                  {/*<div className="mb-0.5">
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
                    disabled={!liquidacionActiva}
                    className={`flex-1 border-2 px-2 py-0.5 text-xs transition-colors ${
                      liquidacionActiva
                        ? "border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                        : "border-gray-300 text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    }`}
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
                    disabled={!liquidacionActiva}
                    className={`flex-1 border-2 px-2 py-0.5 text-xs transition-colors ${
                      liquidacionActiva
                        ? "border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                        : "border-gray-300 text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    }`}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoNuevoCliente(true);
                      setModoModificacion(false);
                    }}
                    disabled={!liquidacionActiva}
                    className={`flex-1 border-2 px-2 py-0.5 text-xs transition-colors ${
                      liquidacionActiva
                        ? "border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                        : "border-gray-300 text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    }`}
                  >
                    Nuevo Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarInputsAbono(!mostrarInputsAbono)}
                    disabled={!liquidacionActiva}
                    className={`flex-1 border-2 px-2 py-0.5 text-xs transition-colors ${
                      liquidacionActiva
                        ? "border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                        : "border-gray-300 text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    }`}
                  >
                    Abono
                  </button>
                  <button
                    type="button"
                    onClick={iniciarModificacion}
                    disabled={!clienteActual || !liquidacionActiva}
                    className={`flex-1 border-2 px-2 py-0.5 text-xs transition-colors ${
                      liquidacionActiva
                        ? "border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
                        : "border-gray-300 text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    }`}
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
                    onClick={() =>
                      cobradorSeleccionado &&
                      cargarUltimoCliente(cobradorSeleccionado)
                    }
                    disabled={!clienteActual || cargando}
                    className="flex-1 border-2 border-gray-400 dark:border-gray-500 dark:text-white
                      bg-white dark:bg-gray-600 px-2 py-0.5 text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
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
                  type="number"
                  value={totalAbonos || ""}
                  readOnly
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2 text-left"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - PRESTAMO
                </label>
                <input
                  type="number"
                  value={totalPrestamos || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTotalPrestamos(val === "" ? 0 : Number(val));
                  }}
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2 text-left"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - GASTOS
                </label>
                <div className="flex gap-0.5 col-span-">
                  <input
                    type="number"
                    value={gastos || ""}
                    onChange={(e) => setGastos(Number(e.target.value) || 0)}
                    className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs text-left"
                  />
                  <label className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    Otr Gas
                  </label>
                  <input
                    type="number"
                    value={otrGas || ""}
                    onChange={(e) => setOtrGas(Number(e.target.value) || 0)}
                    className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs text-left w-20"
                  />
                </div>
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  + BASE
                </label>
                <input
                  type="number"
                  value={base || ""}
                  onChange={(e) => setBase(Number(e.target.value) || 0)}
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2 text-left"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-4">
                  - DESCUENTO
                </label>
                <input
                  type="number"
                  value={descuento || ""}
                  onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2 text-left"
                />
              </div>

              <div className="mb-1 grid grid-cols-6 gap-1">
                <label className="text-left text-xs font-bold text-blue-600 dark:text-blue-400 col-span-2 ml-5">
                  Efectivo
                </label>
                <input
                  type="number"
                  value={efectivoIngresado || ""}
                  onChange={(e) =>
                    setEfectivoIngresado(Number(e.target.value) || 0)
                  }
                  className="border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs col-span-2 text-left"
                />
              </div>

              <div className="items-center flex gap-1">
                <div className="bg-green-500 dark:bg-green-600 px-1 py-1 flex-1 text-center text-xs font-bold text-black">
                  {efectivoEsperado >= 0
                    ? `+${efectivoEsperado}`
                    : efectivoEsperado}
                </div>
                <label className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                  Diferencia:
                </label>
                <div className="bg-yellow-300 dark:bg-yellow-500 px-1 py-1 flex-1 text-center text-xs font-bold text-red-600">
                  {diferencia >= 0 ? `+${diferencia}` : diferencia}
                </div>
              </div>
            </div>

            <div className="bg-blue-700 dark:bg-blue-800 text-white text-center px-1 py-1 text-xs font-bold dark:text-white whitespace-nowrap">
              {fechaHoy}
            </div>

            <div
              className={`text-white text-center py-1 font-bold text-xs rounded shadow transition-colors ${
                guardado
                  ? "bg-green-600 dark:bg-green-700"
                  : "bg-red-600 dark:bg-red-700"
              }`}
            >
              {guardado ? "GUARDADO" : "SIN GUARDAR"}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
                TARJETAS CANCELADAS
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900 text-xs p-1 overflow-y-auto flex-1">
                {tarjetasCanceladas.length === 0 ? (
                  <p className="text-gray-500 text-center italic">Ninguna</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left">Nombre</th>
                        <th className="text-left">Últ. Abono</th>
                        <th className="text-left  ">Días Venc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarjetasCanceladas.map((t, i) => (
                        <tr key={i}>
                          <td className="py-0.5">{t.nombre}</td>
                          <td className="text-left">{t.ultimoAbono}</td>
                          <td className="text-left">{t.diasVencidos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-gray-800 dark:bg-gray-900 text-white text-center py-1 font-bold text-xs">
                PRESTAMOS INGRESADOS
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900 text-xs p-1 overflow-y-auto flex-1">
                {prestamosIngresados.length === 0 ? (
                  <p className="text-gray-500 text-center italic">Ninguno</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left">Nombre</th>
                        <th className="text-left">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestamosIngresados.map((p, i) => (
                        <tr key={i}>
                          <td className="py-0.5">{p.nombre}</td>
                          <td className="text-left">{p.valorPrestamo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded shadow">
              <label className="text-xs font-bold mb-1 text-gray-900 block dark:text-white">
                Buscar Cliente
              </label>
              {/* Búsqueda por nombre*/}
              <select
                className="border border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-1 py-0.5 text-xs mb-1"
                value=""
                onChange={(e) => {
                  const cliCodigo = e.target.value;
                  if (cliCodigo) {
                    buscarClientePorCodigo(Number(cliCodigo));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const cliCodigo = (e.target as HTMLSelectElement).value;
                    if (cliCodigo) {
                      buscarClientePorCodigo(Number(cliCodigo));
                    }
                  }
                }}
              >
                <option value="">— Buscar por nombre —</option>
                {clientesExistentes
                  .filter((c) => c.tarjetaActiva !== null) // Solo activos
                  .map((cliente) => (
                    <option key={cliente.cliCodigo} value={cliente.cliCodigo}>
                      {cliente.cliNombre} ({cliente.cliCodigo})
                    </option>
                  ))}
              </select>

              <div className="items-center mb-1 flex gap-1">
                <label className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  Cédula
                </label>
                <input
                  type="text"
                  placeholder="Ej: 123456"
                  className="flex-1 border border-gray-400 dark:border-gray-500 dark:text-white bg-white dark:bg-gray-600 px-1 py-0.5 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const valor = (e.target as HTMLInputElement).value.trim();
                      const cliCodigo = parseInt(valor, 10);
                      if (!isNaN(cliCodigo)) {
                        buscarClientePorCodigo(cliCodigo);
                      } else {
                        alert("Ingrese una cédula válida");
                      }
                    }
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setLiquidacionActiva(true);
                  setTotalAbonos(0);
                  setTotalPrestamos(0);
                  setGastos(0);
                  setOtrGas(0);
                  setBase(0);
                  setDescuento(0);
                  setEfectivoIngresado(0);
                  setGuardado(false);
                }}
                disabled={liquidacionActiva}
                className={`border-2 w-full px-2 py-1 text-xs font-bold mb-1 ${
                  liquidacionActiva
                    ? "border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "border-green-600 bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                Iniciar Liquidación
              </button>

              <button
                type="submit"
                onClick={handleFinalizarLiquidacion}
                disabled={guardandoReporte}
                className="border-2 border-gray-400 dark:border-gray-500 dark:text-white w-full bg-white dark:bg-gray-600 px-2 py-1 text-xs font-bold"
              >
                {guardandoReporte ? "Guardando..." : "Finalizar Liquidacion"}
              </button>

              {errorReporte && (
                <div className="text-red-600 text-sm mt-2">
                  Error al guardar el reporte: {errorReporte}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbonoForm;
