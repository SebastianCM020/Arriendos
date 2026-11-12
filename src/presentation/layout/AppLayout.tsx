// =============================================================================
// PRESENTACIÓN: AppLayout — Sidebar + Outlet (layout compartido)
// Usa NavLink de React Router para navegación real y estado activo automático
// =============================================================================

import { Outlet, NavLink } from 'react-router-dom';

// ---- Definición de items del menú ----
interface NavItem {
  to:    string;
  label: string;
  path:  string; // SVG path del icono
}

const NAV_ITEMS: NavItem[] = [
  {
    to:    '/dashboard',
    label: 'Dashboard',
    path:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to:    '/propiedades',
    label: 'Propiedades',
    path:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    to:    '/inquilinos',
    label: 'Inquilinos',
    path:  'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    to:    '/contratos',
    label: 'Contratos',
    path:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    to:    '/pagos',
    label: 'Pagos',
    path:  'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    to:    '/servicios',
    label: 'Servicios',
    path:  'M13 10V3L4 14h7v7l9-11h-7z',
  },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* ── Sidebar fijo ── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-zinc-900/50 border-r border-white/5 p-6 fixed top-0 left-0 bottom-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Arriendos</p>
            <p className="text-xs text-zinc-500">Sistema de Gestión</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              V
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">VizSoft</p>
              <p className="text-xs text-zinc-500 truncate">admin@vizsoft.cl</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Barra móvil (bottom nav) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${
                isActive ? 'text-violet-400' : 'text-zinc-500'
              }`
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Área de contenido ── */}
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
