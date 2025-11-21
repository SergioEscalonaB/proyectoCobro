import React from 'react';
import CobrosForm from '../components/CobrosForm';
import { Link } from 'react-router-dom';

const CobroPage: React.FC = () => {
  return (
    <div className="p-8">
      <CobrosForm />
      <Link to="/" className="text-blue-500 hover:text-blue-700 font-medium">
        ← Volver al Menú
      </Link>
    </div>
  );
};

export default CobroPage;
