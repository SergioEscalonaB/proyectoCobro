import React from 'react';
import { Link } from 'react-router-dom';

const ReportePage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Página de Reporte</h1>
      <p className="text-gray-600 mb-4">
        Este es un marcador de posición para la funcionalidad de Reporte.
        Aquí es donde desarrollarías la interfaz y lógica para la generación de reportes.
      </p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 font-medium">
        ← Volver al Menú
      </Link>
    </div>
  );
};

export default ReportePage;
