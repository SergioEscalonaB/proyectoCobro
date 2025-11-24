import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Guardar el JWT
        localStorage.setItem('token', data.token);
        // Redirigir al menú principal
        navigate('/', { replace: true });
      } else {
        // Error desde el backend credenciales inválidas
        setError(data.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Por favor intenta más tarde.');
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          {/* Botón de Enviar */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Entrar'}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          Usa tus credenciales de usuario para acceder.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;