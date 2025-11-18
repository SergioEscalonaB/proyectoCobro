import React from 'react';
import { Link } from 'react-router-dom';

const CobroPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Página de Cobro</h1>
      <p className="text-gray-600 mb-4">
        Este es un marcador de posición para la funcionalidad de Cobro.
        Aquí es donde desarrollarías la interfaz y lógica para gestionar los cobros.
      </p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 font-medium">
        ← Volver al Menú
      </Link>
    </div>
  );
};

export default CobroPage;
