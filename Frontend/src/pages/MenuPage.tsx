import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Componente de la página del Menú Principal.
 * Muestra las opciones de navegación y permite al usuario cerrar sesión.*/
const MenuPage: React.FC = () => {
  // Hook para la navegación programática
  const navigate = useNavigate();

  // Opciones del menú con sus rutas
  const menuOptions = [
    { name: 'Cobros', path: '/cobro', description: 'Gestión de rutas.' },
    { name: 'Clientes', path: '/cliente', description: 'Administración de la información de los clientes.' },
    { name: 'Liquidacion', path: '/abono', description: 'Página de gestión de abonos.' },
    { name: 'Reportes', path: '/reporte', description: 'Generación y visualización de reportes.' },
  ];

  /*Maneja el cierre de sesión del usuario.*/
  const handleLogout = () => {
    // 1. **Cerrar Sesión**
    // Se elimina el indicador de sesión del almacenamiento local.
    localStorage.setItem('isLoggedIn', 'false');
    
    // 2. **Redirección**
    // Se navega a la página de login.
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900">Menú Principal de Gestión</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuOptions.map((option) => (
            // Link de React Router para la navegación sin recargar la página
            <Link 
              key={option.path} 
              to={option.path} 
              className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02]"
            >
              <h2 className="text-xl font-bold text-blue-600 mb-2">{option.name}</h2>
              <p className="text-gray-600">{option.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg">
          <p className="font-semibold">Nota para el estudiante:</p>
          <p className="text-sm">
            La navegación se realiza con **React Router DOM** |`-Link to="..."-`|, que permite cambiar de página
            sin recargar todo el navegador, lo que es la práctica estándar en aplicaciones React.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
