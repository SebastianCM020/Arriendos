// =============================================================================
// APLICACIÓN: App.tsx — Configuración de rutas con React Router v7
// =============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './presentation/layout/AppLayout';
import { Dashboard } from './presentation/pages/Dashboard';
import { PropiedadesPage } from './presentation/pages/PropiedadesPage';
import { InquilinosPage } from './presentation/pages/InquilinosPage';
import { ContratosPage } from './presentation/pages/ContratosPage';
import { PagosPage } from './presentation/pages/PagosPage';
import { ServiciosPage } from './presentation/pages/ServiciosPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todas las rutas comparten el layout con sidebar */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="propiedades" element={<PropiedadesPage />} />
          <Route path="inquilinos"  element={<InquilinosPage />} />
          <Route path="contratos"   element={<ContratosPage />} />
          <Route path="pagos"       element={<PagosPage />} />
          <Route path="servicios"   element={<ServiciosPage />} />
          {/* Ruta comodín: redirige al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
