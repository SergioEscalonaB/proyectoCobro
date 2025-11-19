import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Reporte {
  id: number;
  cobCodigo: string;
  cobro: number;
  prestamos: number;
  gastos: number;
  otrosGastos: number;
  base: number;
  descuento: number;
  efectivo: number;
  diferencia: number;
  fecha: string;
}

interface Cobrador {
  cobCodigo: string;
  cobNombre: string;
}

const ReporteForm: React.FC = () => {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [filtroCobrador, setFiltroCobrador] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar cobradores (para filtro)
  const cargarCobradores = async () => {
    try {
      const res = await fetch('http://localhost:3000/cobros');
      if (!res.ok) throw new Error('Error al cargar cobradores');
      const data = await res.json();
      setCobradores(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Cargar reportes
  const cargarReportes = async (cobCodigo?: string) => {
    setCargando(true);
    setError(null);
    try {
      const url = cobCodigo
        ? `http://localhost:3000/reporte/cobrador/${cobCodigo}`
        : 'http://localhost:3000/reporte';
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar reportes');
      const data = await res.json();
      setReportes(data);
    } catch (err: any) {
      setError(err.message);
      setReportes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCobradores();
    cargarReportes();
  }, []);

  useEffect(() => {
    cargarReportes(filtroCobrador || undefined);
  }, [filtroCobrador]);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Está seguro que desea eliminar este reporte?')) return;

    try {
      const res = await fetch(`http://localhost:3000/reporte/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar el reporte');
      setReportes(reportes.filter(r => r.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatearFecha = (isoFecha: string): string => {
    const fecha = new Date(isoFecha);
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-700 rounded shadow p-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Reportes de Liquidación</h1>

        <Link
          to="/"
          className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← Volver al Menú
        </Link>

        {/* Filtro por cobrador */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            Filtrar por cobrador:
          </label>
          <select
            value={filtroCobrador}
            onChange={(e) => setFiltroCobrador(e.target.value)}
            className="border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-white rounded px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {cobradores.map((c) => (
              <option key={c.cobCodigo} value={c.cobCodigo}>
                {c.cobCodigo} - {c.cobNombre}
              </option>
            ))}
          </select>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        {/* Tabla de reportes */}
        {cargando ? (
          <p className="text-gray-600 dark:text-gray-300">Cargando reportes...</p>
        ) : reportes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">No hay reportes disponibles.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-200 dark:bg-gray-600">
                <tr>
                  <th className="border px-2 py-1">ID</th>
                  <th className="border px-2 py-1">Cobrador</th>
                  <th className="border px-2 py-1">Fecha</th>
                  <th className="border px-2 py-1">Cobro</th>
                  <th className="border px-2 py-1">Préstamos</th>
                  <th className="border px-2 py-1">Gastos</th>
                  <th className="border px-2 py-1">Otros Gastos</th>
                  <th className="border px-2 py-1">Base</th>
                  <th className="border px-2 py-1">Descuento</th>
                  <th className="border px-2 py-1">Efectivo</th>
                  <th className="border px-2 py-1">Diferencia</th>
                  <th className="border px-2 py-1">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700">
                {reportes.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="border px-2 py-1 text-center">{rep.id}</td>
                    <td className="border px-2 py-1">{rep.cobCodigo}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{formatearFecha(rep.fecha)}</td>
                    <td className="border px-2 py-1 text-right">{rep.cobro.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.prestamos.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.gastos.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.otrosGastos.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.base.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.descuento.toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{rep.efectivo.toLocaleString()}</td>
                    <td
                      className={`border px-2 py-1 text-right font-bold ${
                        rep.diferencia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {rep.diferencia >= 0 ? `+${rep.diferencia}` : rep.diferencia}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => handleEliminar(rep.id)}
                        className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteForm;