import React from 'react';
import ClientesForm from '../components/ClientesForm';
import { Link } from 'react-router-dom';

const ClientePage: React.FC = () => {
  return (
    <div className="p-8">
      <ClientesForm />
      <Link to="/" className="text-blue-500 hover:text-blue-700 font-medium">
        ← Volver al Menú
      </Link>
    </div>
  );
};

export default ClientePage;
