import React from 'react';
import AbonoForm from '../components/AbonoForm'; // El componente principal que convertiremos

/*Componente de la página de Abono.*/
const AbonoPage: React.FC = () => {
  return (
    <div>
      <AbonoForm /> {/* Renderiza el formulario de abono */}
    </div>
  );
};

export default AbonoPage;
