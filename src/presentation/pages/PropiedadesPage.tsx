// =============================================================================
// PRESENTACIÓN: PropiedadesPage
// Gestión de propiedades. Por ahora administra una única propiedad:
// "Casa Pisulli". La estructura está lista para escalar a múltiples propiedades.
// =============================================================================

import React, { useState } from 'react';

// ---- Tipos locales ----

type EstadoPropiedad = 'arrendada' | 'disponible' | 'mantenimiento' | 'inactiva';

interface Propiedad {
  id:                  string;
  nombre:              string;
  direccion:           string;
  comuna:              string;
  tipo:                string;
  metrosCuadrados:     number;
  habitaciones:        number;
  banos:               number;
  precioBase:          number;
  estado:              EstadoPropiedad;
  descripcion:         string;
}

// ---- Datos de la propiedad ----
// Casa Pisulli: la única propiedad del sistema en esta etapa

const CASA_PISULLI: Propiedad = {
  id:              '00000000-0000-0000-0000-000000000001',
  nombre:          'Casa Pisulli',
  direccion:       'Av. Pisulli 1234',
  comuna:          'Providencia',
  tipo:            'Casa',
  metrosCuadrados: 120,
  habitaciones:    3,
  banos:           2,
  precioBase:      750_000,
  estado:          'arrendada',
  descripcion:     'Casa de dos pisos con jardín. Incluye estacionamiento, bodega y acceso a áreas comunes.',
};

// ---- Helpers ----

const formatCLP = (monto: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto);

const ESTADO_CONFIG: Record<EstadoPropiedad, { texto: string; clases: string }> = {
  arrendada:     { texto: 'Arrendada',     clases: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  disponible:    { texto: 'Disponible',    clases: 'bg-blue-500/15    text-blue-400    border-blue-500/30'    },
  mantenimiento: { texto: 'Mantenimiento', clases: 'bg-amber-500/15   text-amber-400   border-amber-500/30'   },
  inactiva:      { texto: 'Inactiva',      clases: 'bg-zinc-500/15    text-zinc-400    border-zinc-500/30'    },
};

// ---- Sub-componentes ----

const BadgeEstadoProp: React.FC<{ estado: EstadoPropiedad }> = ({ estado }) => {
  const { texto, clases } = ESTADO_CONFIG[estado];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${clases}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {texto}
    </span>
  );
};

interface StatCardProps {
  icono: React.ReactNode;
  label: string;
  valor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icono, label, valor }) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-4">
    <div className="w-10 h-10 bg-violet-500/15 text-violet-400 rounded-lg flex items-center justify-center flex-shrink-0">
      {icono}
    </div>
    <div>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{valor}</p>
    </div>
  </div>
);

// ---- Modal de edición (placeholder funcional) ----

interface ModalEdicionProps {
  propiedad: Propiedad;
  onCerrar:  () => void;
}

const ModalEdicion: React.FC<ModalEdicionProps> = ({ propiedad, onCerrar }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-titulo"
    onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
  >
    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 id="modal-titulo" className="text-base font-semibold text-white">
          Editar Propiedad
        </h2>
        <button
          onClick={onCerrar}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cuerpo */}
      <div className="p-6 space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="edit-nombre">
            Nombre de la propiedad
          </label>
          <input
            id="edit-nombre"
            type="text"
            defaultValue={propiedad.nombre}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="edit-direccion">
            Dirección
          </label>
          <input
            id="edit-direccion"
            type="text"
            defaultValue={propiedad.direccion}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="edit-precio">
            Precio de arriendo (CLP)
          </label>
          <input
            id="edit-precio"
            type="number"
            defaultValue={propiedad.precioBase}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="edit-estado">
            Estado
          </label>
          <select
            id="edit-estado"
            defaultValue={propiedad.estado}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            <option value="arrendada">Arrendada</option>
            <option value="disponible">Disponible</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="edit-descripcion">
            Descripción
          </label>
          <textarea
            id="edit-descripcion"
            rows={3}
            defaultValue={propiedad.descripcion}
            className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
        <button
          onClick={onCerrar}
          className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-xl
            hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          id="btn-guardar-propiedad"
          onClick={onCerrar}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold
            rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// PropiedadesPage — componente principal
// ============================================================================
export function PropiedadesPage() {
  const propiedad = CASA_PISULLI;
  const [modalAbierto, setModalAbierto] = useState(false);

  const stats: StatCardProps[] = [
    {
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
      label: 'Superficie',
      valor: `${propiedad.metrosCuadrados} m²`,
    },
    {
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: 'Habitaciones',
      valor: `${propiedad.habitaciones} dormitorios`,
    },
    {
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      label: 'Baños',
      valor: `${propiedad.banos} baños`,
    },
    {
      icono: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Comuna',
      valor: propiedad.comuna,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Propiedades</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gestión de inmuebles arrendados</p>
        </div>
        <button
          id="btn-editar-propiedad"
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500
            text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar propiedad
        </button>
      </div>

      {/* Tarjeta principal de la propiedad */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden mb-6">
        {/* Banner superior */}
        <div className="h-3 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600" />

        <div className="p-6 lg:p-8">
          {/* Nombre + estado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-indigo-500/20
                border border-violet-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{propiedad.nombre}</h2>
                <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {propiedad.direccion}, {propiedad.comuna}
                </p>
              </div>
            </div>
            <BadgeEstadoProp estado={propiedad.estado} />
          </div>

          {/* Stats de características */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Precio + descripción */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Precio */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Precio de arriendo mensual
              </p>
              <p className="text-3xl font-bold text-emerald-400">{formatCLP(propiedad.precioBase)}</p>
              <p className="text-xs text-zinc-500 mt-1">Precio base · puede variar por contrato</p>
            </div>

            {/* Descripción */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Descripción
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{propiedad.descripcion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso de escalabilidad */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-blue-300">Modo propiedad única</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            El sistema está configurado para gestionar <strong className="text-zinc-300">Casa Pisulli</strong>.
            Cuando necesites agregar más propiedades, esta pantalla se transformará en un listado.
          </p>
        </div>
      </div>

      {/* Modal de edición */}
      {modalAbierto && (
        <ModalEdicion
          propiedad={propiedad}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
