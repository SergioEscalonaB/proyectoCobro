import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPage from './pages/MenuPage';
import CobroPage from './pages/CobroPage';
import ClientePage from './pages/ClientePage';
import AbonoPage from './pages/AbonoPage';
import ReportePage from './pages/ReportePage';

/*Ruta protegida Valida que exista un token para permitir el acceso. */
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const token = localStorage.getItem('token');

  // Si no hay token, redirige a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, permite el acceso
  return <>{element}</>;
};

// Componente principal de la aplicación
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route path="/" element={<ProtectedRoute element={<MenuPage />} />} />
        <Route path="/cobro" element={<ProtectedRoute element={<CobroPage />} />} />
        <Route path="/cliente" element={<ProtectedRoute element={<ClientePage />} />} />
        <Route path="/abono" element={<ProtectedRoute element={<AbonoPage />} />} />
        <Route path="/reporte" element={<ProtectedRoute element={<ReportePage />} />} />

              {/* Cualquier otra ruta redirige al inicio */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        );
      };
      
      export default App;
