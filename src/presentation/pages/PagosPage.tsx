// =============================================================================
// PRESENTACIÓN: PagosPage — Placeholder funcional
// Registro de pagos e ingresos. Se conectará a Supabase en la próxima iteración.
// =============================================================================

import React, { useState } from 'react';

type EstadoPago = 'pagado' | 'pendiente' | 'vencido';

interface PagoMock {
  id:               string;
  inquilino:        string;
  propiedad:        string;
  categoria:        string;
  tipo:             'ingreso' | 'egreso';
  monto:            number;
  fechaVencimiento: string;
  fechaPago?:       string;
  estado:           EstadoPago;
  metodo?:          string;
}

const PAGOS_MOCK: PagoMock[] = [
  {
    id: '1', inquilino: 'Carlos Mendoza', propiedad: 'Casa Pisulli',
    categoria: 'Arriendo', tipo: 'ingreso', monto: 750_000,
    fechaVencimiento: '2026-07-05', fechaPago: '2026-07-04',
    estado: 'pagado', metodo: 'Transferencia',
  },
  {
    id: '2', inquilino: 'Carlos Mendoza', propiedad: 'Casa Pisulli',
    categoria: 'Agua', tipo: 'egreso', monto: 28_400,
    fechaVencimiento: '2026-07-15', estado: 'pendiente',
  },
  {
    id: '3', inquilino: 'Carlos Mendoza', propiedad: 'Casa Pisulli',
    categoria: 'Luz', tipo: 'egreso', monto: 54_200,
    fechaVencimiento: '2026-06-30', estado: 'vencido',
  },
];

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
const formatFecha = (f?: string) =>
  f ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(f + 'T00:00:00')) : '—';

const ESTADO_CONFIG: Record<EstadoPago, { texto: string; clases: string }> = {
  pagado:   { texto: 'Pagado',    clases: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  pendiente:{ texto: 'Pendiente', clases: 'bg-amber-500/15   text-amber-400   border border-amber-500/30'  },
  vencido:  { texto: 'Vencido',   clases: 'bg-red-500/15     text-red-400     border border-red-500/30'    },
};

type Filtro = 'todos' | 'ingreso' | 'egreso' | 'pendiente' | 'vencido';

export function PagosPage() {
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const pagosFiltrados = PAGOS_MOCK.filter((p) => {
    if (filtro === 'todos')     return true;
    if (filtro === 'ingreso')   return p.tipo === 'ingreso';
    if (filtro === 'egreso')    return p.tipo === 'egreso';
    if (filtro === 'pendiente') return p.estado === 'pendiente';
    if (filtro === 'vencido')   return p.estado === 'vencido';
    return true;
  });

  const totalIngresos = PAGOS_MOCK.filter(p => p.tipo === 'ingreso' && p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const totalEgresos  = PAGOS_MOCK.filter(p => p.tipo === 'egreso'  && p.estado === 'pagado').reduce((s, p) => s + p.monto, 0);
  const pendientes    = PAGOS_MOCK.filter(p => p.estado === 'pendiente' || p.estado === 'vencido').length;

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todos',     label: 'Todos' },
    { id: 'ingreso',   label: 'Ingresos' },
    { id: 'egreso',    label: 'Egresos' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'vencido',   label: 'Vencidos' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pagos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registro de ingresos y gastos</p>
        </div>
        <button
          id="btn-registrar-pago"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500
            text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar pago
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">Ingresos cobrados</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCLP(totalIngresos)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">Gastos pagados</p>
          <p className="text-2xl font-bold text-red-400">{formatCLP(totalEgresos)}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">Pendientes / Vencidos</p>
          <p className="text-2xl font-bold text-amber-400">{pendientes}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filtro === f.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Tipo / Categoría','Propiedad','Vencimiento','Pago','Monto','Estado'].map((col) => (
                  <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map((p) => {
                const { texto, clases } = ESTADO_CONFIG[p.estado];
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          p.tipo === 'ingreso' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d={p.tipo === 'ingreso' ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'} />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{p.categoria}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{p.inquilino}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">{p.propiedad}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-400">{formatFecha(p.fechaVencimiento)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-400">{formatFecha(p.fechaPago)}</p>
                      {p.metodo && <p className="text-xs text-zinc-600 mt-0.5">{p.metodo}</p>}
                    </td>
                    <td className="py-4 px-4">
                      <p className={`text-sm font-semibold tabular-nums ${
                        p.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {p.tipo === 'ingreso' ? '+' : '−'}{formatCLP(p.monto)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clases}`}>
                        {texto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
