import React from 'react';
import ReporteForm from '../components/ReporteForm';
import { Link } from 'react-router-dom';

const ReportePage: React.FC = () => {
  return (
    <div className="p-8">
      <ReporteForm />
      <Link to="/" className="text-blue-500 hover:text-blue-700 font-medium">
        ← Volver al Menú
      </Link>
    </div>
  );
};

export default ReportePage;
