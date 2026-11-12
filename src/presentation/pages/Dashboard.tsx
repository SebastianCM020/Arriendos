// =============================================================================
// PRESENTACIÓN: Dashboard Principal
// El sidebar fue movido a AppLayout. Este componente solo renderiza
// el contenido de la página: métricas + tabla de últimos movimientos.
// =============================================================================

import React from 'react';
import { useDashboardMetrics } from '../../application/hooks/useDashboardMetrics';
import type { TransaccionResumen } from '../../domain/models/Transaccion';

// ---- Utilidades de formateo ----

const formatCLP = (monto: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto);

const formatFecha = (fecha?: string): string => {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(fecha + 'T00:00:00'));
};

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ---- Sub-componentes ----

interface MetricCardProps {
  titulo:    string;
  valor:     string | number;
  subtitulo?: string;
  icono:     React.ReactNode;
  variante:  'verde' | 'ambar' | 'rojo' | 'azul';
  cargando?: boolean;
}

const COLORES_CARD: Record<MetricCardProps['variante'], { borde: string; icono: string }> = {
  verde: { borde: 'border-emerald-500/30', icono: 'bg-emerald-500/15 text-emerald-400' },
  ambar: { borde: 'border-amber-500/30',   icono: 'bg-amber-500/15  text-amber-400'   },
  rojo:  { borde: 'border-red-500/30',     icono: 'bg-red-500/15    text-red-400'     },
  azul:  { borde: 'border-blue-500/30',    icono: 'bg-blue-500/15   text-blue-400'    },
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
);

const MetricCard: React.FC<MetricCardProps> = ({
  titulo, valor, subtitulo, icono, variante, cargando,
}) => {
  const c = COLORES_CARD[variante];
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border ${c.borde}
      bg-gradient-to-br from-white/5 to-white/[0.02]
      backdrop-blur-sm p-6 shadow-lg
      transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group
    `}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-1">{titulo}</p>
          {cargando
            ? <Skeleton className="h-9 w-36 mt-1" />
            : <p className="text-3xl font-bold text-white tracking-tight">{valor}</p>
          }
          {subtitulo && (
            <p className="text-xs text-zinc-500 mt-2">{subtitulo}</p>
          )}
        </div>
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
          ${c.icono} transition-transform duration-300 group-hover:scale-110`}>
          {icono}
        </div>
      </div>
    </div>
  );
};

const ESTADOS_BADGE: Record<TransaccionResumen['estado'], { texto: string; clases: string }> = {
  pagado:   { texto: 'Pagado',    clases: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  pendiente:{ texto: 'Pendiente', clases: 'bg-amber-500/15   text-amber-400   border border-amber-500/30'  },
  vencido:  { texto: 'Vencido',   clases: 'bg-red-500/15     text-red-400     border border-red-500/30'    },
  anulado:  { texto: 'Anulado',   clases: 'bg-zinc-500/15    text-zinc-400    border border-zinc-500/30'   },
};

const BadgeEstado: React.FC<{ estado: TransaccionResumen['estado'] }> = ({ estado }) => {
  const { texto, clases } = ESTADOS_BADGE[estado];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clases}`}>
      {texto}
    </span>
  );
};

const FilaPago: React.FC<{ pago: TransaccionResumen; index: number }> = ({ pago, index }) => (
  <tr
    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-150"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          pago.tipo === 'ingreso' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {pago.tipo === 'ingreso' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{pago.inquilinoNombre}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{pago.categorianombre}</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <p className="text-sm text-zinc-300 truncate max-w-[200px]">{pago.propiedadNombre}</p>
    </td>
    <td className="py-4 px-4">
      <p className={`text-sm font-semibold tabular-nums ${
        pago.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {pago.tipo === 'ingreso' ? '+' : '−'}{formatCLP(pago.monto)}
      </p>
    </td>
    <td className="py-4 px-4">
      <p className="text-sm text-zinc-400">{formatFecha(pago.fechaVencimiento)}</p>
    </td>
    <td className="py-4 px-4">
      <p className="text-sm text-zinc-400">{formatFecha(pago.fechaPago)}</p>
    </td>
    <td className="py-4 px-4">
      <BadgeEstado estado={pago.estado} />
    </td>
  </tr>
);

// ---- Pantalla de error ----
const ErrorState: React.FC<{ mensaje: string; onRetry: () => void }> = ({ mensaje, onRetry }) => (
  <div className="flex items-center justify-center min-h-[60vh] p-6">
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Error al cargar datos</h3>
      <p className="text-sm text-zinc-400 mb-6">{mensaje}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
);

// ============================================================================
// Dashboard — componente principal
// ============================================================================
export function Dashboard() {
  const {
    metricas,
    ultimosPagos,
    cargando,
    error,
    mesActual,
    anioActual,
    cambiarPeriodo,
    recargar,
  } = useDashboardMetrics();

  // Crear un nuevo Date por iteración para evitar que setMonth mute
  // la misma referencia y genere keys duplicadas en el selector
  const opcionesPeriodo = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now());
    d.setDate(1);                      // fijar al día 1 para evitar overflow de mes
    d.setMonth(d.getMonth() - i);
    return { mes: d.getMonth() + 1, anio: d.getFullYear() };
  });

  const manejarCambioPeriodo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [mes, anio] = e.target.value.split('-').map(Number);
    cambiarPeriodo(mes, anio);
  };

  if (error) return <ErrorState mensaje={error} onRetry={recargar} />;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Control</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {MESES[mesActual - 1]} {anioActual} · Resumen financiero
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="selector-periodo"
            value={`${mesActual}-${anioActual}`}
            onChange={manejarCambioPeriodo}
            className="bg-zinc-900 border border-white/10 text-sm text-zinc-300 rounded-xl
              px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            {opcionesPeriodo.map(({ mes, anio }) => (
              <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>
                {MESES[mes - 1]} {anio}
              </option>
            ))}
          </select>
          <button
            id="btn-recargar-dashboard"
            onClick={recargar}
            disabled={cargando}
            title="Recargar datos"
            className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400
              hover:text-white hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <MetricCard
          titulo="Ingresos del Mes"
          valor={cargando ? '…' : formatCLP(metricas?.ingresosDelMes ?? 0)}
          subtitulo={`${metricas?.propiedadesOcupadas ?? 0} propiedades arrendadas`}
          variante="verde"
          cargando={cargando}
          icono={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          titulo="Facturas Pendientes"
          valor={cargando ? '…' : (metricas?.facturasPendientes ?? 0)}
          subtitulo={metricas?.facturasVencidas ? `${metricas.facturasVencidas} vencidas sin pagar` : 'Al día'}
          variante={metricas?.facturasPendientes ? 'ambar' : 'verde'}
          cargando={cargando}
          icono={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <MetricCard
          titulo="Inquilinos Morosos"
          valor={cargando ? '…' : (metricas?.inquilinosMorosos ?? 0)}
          subtitulo={metricas?.inquilinosMorosos ? 'Requieren atención inmediata' : 'Todos al día'}
          variante={metricas?.inquilinosMorosos ? 'rojo' : 'verde'}
          cargando={cargando}
          icono={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Mini-stats de estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Arrendadas',  valor: metricas?.propiedadesOcupadas    ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Disponibles', valor: metricas?.propiedadesDisponibles  ?? 0, color: 'text-blue-400',   bg: 'bg-blue-500/10    border-blue-500/20'    },
          { label: 'Vencidas',    valor: metricas?.facturasVencidas        ?? 0, color: 'text-red-400',    bg: 'bg-red-500/10     border-red-500/20'     },
          { label: 'Pend. Cobro', valor: metricas?.facturasPendientes      ?? 0, color: 'text-amber-400',  bg: 'bg-amber-500/10   border-amber-500/20'   },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border ${item.bg} p-4 text-center transition-transform duration-200 hover:scale-[1.02]`}>
            {cargando
              ? <Skeleton className="h-7 w-12 mx-auto mb-1" />
              : <p className={`text-2xl font-bold ${item.color}`}>{item.valor}</p>
            }
            <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla de últimos movimientos */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">Últimos Movimientos</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {ultimosPagos.length} registros · {MESES[mesActual - 1]} {anioActual}
            </p>
          </div>
          <button
            id="btn-ver-todos-pagos"
            className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
          >
            Ver todos
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : ultimosPagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">Sin movimientos</p>
              <p className="text-xs text-zinc-600 mt-1">No hay registros para este período</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Inquilino / Categoría','Propiedad','Monto','Vencimiento','Pagado el','Estado'].map((col) => (
                    <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultimosPagos.map((pago, i) => (
                  <FilaPago key={pago.id} pago={pago} index={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
