// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import CobroPage from './pages/CobroPage';
import ClientePage from './pages/ClientePage';
import AbonoPage from './pages/AbonoPage';
import ReportePage from './pages/ReportePage';

/**
 * Componente de Ruta Protegida (ProtectedRoute)
 * 
 * Este componente verifica si el usuario está "logueado" antes de permitir
 * el acceso a la página. Si no lo está, redirige a la página de Login.
 * 
 * @param {React.ReactNode} element - El componente de página a renderizar si está autenticado.
 */
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  // Simulación de autenticación: se verifica si existe una clave 'isLoggedIn' en localStorage
  // En un proyecto real, esto se haría con un token de sesión o un contexto de autenticación.
  const storedAuth = localStorage.getItem('isLoggedIn') === 'true';

  // Si no está autenticado, redirige a /login
  if (!storedAuth) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, muestra el elemento (la página)
  return <>{element}</>;
};


/**
 * Componente principal de la aplicación (App)
 * 
 * Configura el sistema de navegación de la aplicación usando React Router.
 */
const App: React.FC = () => {
  return (
    // BrowserRouter: Contenedor principal para el enrutamiento.
    <BrowserRouter>
      {/* Routes: Define el área donde se renderizarán los componentes según la ruta */}
      <Routes>
        {/* Ruta de Login: accesible para todos */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas Protegidas: solo accesibles si el usuario está "logueado" */}
        {/* Usamos ProtectedRoute para asegurar que solo usuarios autenticados vean estas páginas */}
        <Route path="/" element={<ProtectedRoute element={<MenuPage />} />} />
        <Route path="/cobro" element={<ProtectedRoute element={<CobroPage />} />} />
        <Route path="/cliente" element={<ProtectedRoute element={<ClientePage />} />} />
        {/* La página Abono es la que contiene el HTML que proporcionaste */}
        <Route path="/abono" element={<ProtectedRoute element={<AbonoPage />} />} />
        <Route path="/reporte" element={<ProtectedRoute element={<ReportePage />} />} />

        {/* Ruta por defecto: redirige a la página principal (que es el Menú) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
