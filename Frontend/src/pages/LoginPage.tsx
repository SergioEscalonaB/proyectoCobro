// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de la página de Login.
 * 
 * Permite al usuario "iniciar sesión" con credenciales hardcodeadas
 * y redirige al menú principal.
 */
const LoginPage: React.FC = () => {
  // Hook para la navegación programática
  const navigate = useNavigate();
  // Estados para los campos del formulario
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  // Estado para mensajes de error
  const [error, setError] = useState('');

  // Credenciales de acceso fácil (hardcodeadas)
  const USUARIO_FACIL = 'admin';
  const CONTRASENA_FACIL = '1234';

  /**
   * Maneja el envío del formulario de login.
   * @param e Evento de formulario.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    // 1. **Validación de Credenciales**
    // Se verifica si el usuario y la contraseña coinciden con los valores predefinidos.
    if (usuario === USUARIO_FACIL && contrasena === CONTRASENA_FACIL) {
      // 2. **Simulación de Sesión**
      // Se guarda un indicador en el almacenamiento local para simular que el usuario ha iniciado sesión.
      localStorage.setItem('isLoggedIn', 'true');
      
      // 3. **Redirección**
      // Se navega a la ruta principal de la aplicación (el menú).
      navigate('/', { replace: true });
    } else {
      // 4. **Manejo de Error**
      setError('Usuario o Contraseña incorrectos. Usa admin/1234.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-sm">
              {error}
            </div>
          )}

          {/* Campo de Usuario */}
          <div className="mb-4">
            <label htmlFor="usuario" className="block text-gray-700 text-sm font-bold mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div className="mb-6">
            <label htmlFor="contrasena" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="contrasena"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          {/* Botón de Enviar */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Entrar
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          Acceso Fácil: Usuario: **{USUARIO_FACIL}** / Contraseña: **{CONTRASENA_FACIL}**
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
