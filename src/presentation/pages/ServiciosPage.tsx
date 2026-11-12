// =============================================================================
// PRESENTACIÓN: ServiciosPage — Gestión de Servicios Básicos
// Agua: 1 planilla general del edificio
// Luz:  3 planillas por piso (Piso 1, Piso 2, Piso 3)
// Permite registrar, visualizar y marcar como pagadas las planillas.
// =============================================================================

import React, { useState } from 'react';

// ---- Tipos ----

type TipoServicio = 'agua' | 'luz';
type EstadoPlanilla = 'pendiente' | 'pagado' | 'vencido';
type TabActiva = TipoServicio | 'historial';

const REFERENCIAS_AGUA = ['General Edificio'] as const;
const REFERENCIAS_LUZ  = ['Piso 1', 'Piso 2', 'Piso 3'] as const;
type ReferenciaAgua = typeof REFERENCIAS_AGUA[number];
type ReferenciaLuz  = typeof REFERENCIAS_LUZ[number];

interface Planilla {
  id:               string;
  tipo:             TipoServicio;
  referencia:       string;
  periodoMes:       number;
  periodoAnio:      number;
  lecturaAnterior?: number;
  lecturaActual?:   number;
  consumo?:         number;
  monto:            number;
  fechaVencimiento: string;
  fechaPago?:       string;
  estado:           EstadoPlanilla;
  numeroBoleta?:    string;
}

// ---- Datos mock ----

const PLANILLAS_MOCK: Planilla[] = [
  // Agua — planilla general
  {
    id: 'a1', tipo: 'agua', referencia: 'General Edificio',
    periodoMes: 7, periodoAnio: 2026,
    lecturaAnterior: 1240.5, lecturaActual: 1318.2, consumo: 77.7,
    monto: 42_800, fechaVencimiento: '2026-07-20',
    estado: 'pendiente', numeroBoleta: 'A-2026-007',
  },
  {
    id: 'a2', tipo: 'agua', referencia: 'General Edificio',
    periodoMes: 6, periodoAnio: 2026,
    lecturaAnterior: 1165.0, lecturaActual: 1240.5, consumo: 75.5,
    monto: 39_600, fechaVencimiento: '2026-06-20', fechaPago: '2026-06-18',
    estado: 'pagado', numeroBoleta: 'A-2026-006',
  },
  {
    id: 'a3', tipo: 'agua', referencia: 'General Edificio',
    periodoMes: 5, periodoAnio: 2026,
    lecturaAnterior: 1090.0, lecturaActual: 1165.0, consumo: 75.0,
    monto: 38_200, fechaVencimiento: '2026-05-20', fechaPago: '2026-05-15',
    estado: 'pagado', numeroBoleta: 'A-2026-005',
  },
  // Luz Piso 1
  {
    id: 'l1p1', tipo: 'luz', referencia: 'Piso 1',
    periodoMes: 7, periodoAnio: 2026,
    lecturaAnterior: 5420, lecturaActual: 5638, consumo: 218,
    monto: 36_500, fechaVencimiento: '2026-07-15',
    estado: 'vencido', numeroBoleta: 'L-P1-2026-007',
  },
  {
    id: 'l2p1', tipo: 'luz', referencia: 'Piso 1',
    periodoMes: 6, periodoAnio: 2026,
    lecturaAnterior: 5210, lecturaActual: 5420, consumo: 210,
    monto: 33_200, fechaVencimiento: '2026-06-15', fechaPago: '2026-06-14',
    estado: 'pagado', numeroBoleta: 'L-P1-2026-006',
  },
  // Luz Piso 2
  {
    id: 'l1p2', tipo: 'luz', referencia: 'Piso 2',
    periodoMes: 7, periodoAnio: 2026,
    lecturaAnterior: 3810, lecturaActual: 3994, consumo: 184,
    monto: 31_800, fechaVencimiento: '2026-07-15',
    estado: 'pendiente', numeroBoleta: 'L-P2-2026-007',
  },
  {
    id: 'l2p2', tipo: 'luz', referencia: 'Piso 2',
    periodoMes: 6, periodoAnio: 2026,
    lecturaAnterior: 3634, lecturaActual: 3810, consumo: 176,
    monto: 29_400, fechaVencimiento: '2026-06-15', fechaPago: '2026-06-10',
    estado: 'pagado', numeroBoleta: 'L-P2-2026-006',
  },
  // Luz Piso 3
  {
    id: 'l1p3', tipo: 'luz', referencia: 'Piso 3',
    periodoMes: 7, periodoAnio: 2026,
    lecturaAnterior: 2250, lecturaActual: 2398, consumo: 148,
    monto: 24_600, fechaVencimiento: '2026-07-15',
    estado: 'pendiente', numeroBoleta: 'L-P3-2026-007',
  },
  {
    id: 'l2p3', tipo: 'luz', referencia: 'Piso 3',
    periodoMes: 6, periodoAnio: 2026,
    lecturaAnterior: 2108, lecturaActual: 2250, consumo: 142,
    monto: 22_800, fechaVencimiento: '2026-06-15', fechaPago: '2026-06-12',
    estado: 'pagado', numeroBoleta: 'L-P3-2026-006',
  },
];

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_COMPLETOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ---- Helpers ----

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const formatFecha = (f?: string) =>
  f ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
        .format(new Date(f + 'T00:00:00')) : '—';

const ESTADO_CFG: Record<EstadoPlanilla, { texto: string; clases: string; punto: string }> = {
  pagado:   { texto: 'Pagado',    clases: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', punto: 'bg-emerald-400' },
  pendiente:{ texto: 'Pendiente', clases: 'bg-amber-500/15   text-amber-400   border-amber-500/30',  punto: 'bg-amber-400'  },
  vencido:  { texto: 'Vencido',   clases: 'bg-red-500/15     text-red-400     border-red-500/30',    punto: 'bg-red-400'    },
};

// ---- Sub-componentes reutilizables ----

const BadgeEstado: React.FC<{ estado: EstadoPlanilla }> = ({ estado }) => {
  const { texto, clases, punto } = ESTADO_CFG[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${clases}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${punto}`} />
      {texto}
    </span>
  );
};

// Fila de la tabla de planillas
const FilaPlanilla: React.FC<{
  planilla: Planilla;
  onMarcarPagado: (id: string) => void;
}> = ({ planilla, onMarcarPagado }) => (
  <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
    <td className="py-3.5 px-4">
      <p className="text-sm font-semibold text-white">
        {MESES_COMPLETOS[planilla.periodoMes - 1]} {planilla.periodoAnio}
      </p>
      {planilla.numeroBoleta && (
        <p className="text-xs text-zinc-600 mt-0.5 font-mono">{planilla.numeroBoleta}</p>
      )}
    </td>
    <td className="py-3.5 px-4">
      <p className="text-sm text-zinc-300">{planilla.referencia}</p>
    </td>
    <td className="py-3.5 px-4">
      {planilla.lecturaAnterior !== undefined ? (
        <div className="text-xs text-zinc-400 space-y-0.5">
          <p>Ant: <span className="text-zinc-300 font-mono">{planilla.lecturaAnterior}</span></p>
          <p>Act: <span className="text-zinc-300 font-mono">{planilla.lecturaActual}</span></p>
          <p className="text-violet-400 font-medium">+{planilla.consumo} m³/kWh</p>
        </div>
      ) : (
        <p className="text-xs text-zinc-600">—</p>
      )}
    </td>
    <td className="py-3.5 px-4">
      <p className="text-sm font-bold text-white">{formatCLP(planilla.monto)}</p>
    </td>
    <td className="py-3.5 px-4">
      <p className={`text-sm ${planilla.estado === 'vencido' ? 'text-red-400 font-medium' : 'text-zinc-400'}`}>
        {formatFecha(planilla.fechaVencimiento)}
      </p>
    </td>
    <td className="py-3.5 px-4">
      <p className="text-sm text-zinc-400">{formatFecha(planilla.fechaPago)}</p>
    </td>
    <td className="py-3.5 px-4">
      <BadgeEstado estado={planilla.estado} />
    </td>
    <td className="py-3.5 px-4">
      {planilla.estado !== 'pagado' && (
        <button
          onClick={() => onMarcarPagado(planilla.id)}
          className="opacity-0 group-hover:opacity-100 text-xs font-medium text-emerald-400
            hover:text-emerald-300 transition-all px-2.5 py-1 rounded-lg bg-emerald-500/10
            hover:bg-emerald-500/20 border border-emerald-500/20 whitespace-nowrap"
          title="Marcar como pagado"
        >
          ✓ Pagar
        </button>
      )}
    </td>
  </tr>
);

// ---- Resumen de totales por tipo ----
interface ResumenServicioProps {
  tipo:     TipoServicio;
  planillas: Planilla[];
}

const ResumenServicio: React.FC<ResumenServicioProps> = ({ tipo, planillas }) => {
  const pendientes = planillas.filter(p => p.estado !== 'pagado');
  const montoPendiente = pendientes.reduce((s, p) => s + p.monto, 0);
  const vencidas = planillas.filter(p => p.estado === 'vencido');

  const colorTipo = tipo === 'agua'
    ? { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' }
    : { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' };

  return (
    <div className={`rounded-xl border ${colorTipo.bg} p-4 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl ${colorTipo.bg} flex items-center justify-center flex-shrink-0`}>
        {tipo === 'agua' ? (
          <svg className={`w-5 h-5 ${colorTipo.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 2C6.5 2 2 7.5 2 13a10 10 0 0020 0c0-5.5-4.5-11-10-11z" />
          </svg>
        ) : (
          <svg className={`w-5 h-5 ${colorTipo.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
          {tipo === 'agua' ? 'Agua' : 'Electricidad'} — pendiente
        </p>
        <p className={`text-xl font-bold ${colorTipo.text} mt-0.5`}>{formatCLP(montoPendiente)}</p>
        {vencidas.length > 0 && (
          <p className="text-xs text-red-400 mt-0.5">{vencidas.length} planilla{vencidas.length > 1 ? 's' : ''} vencida{vencidas.length > 1 ? 's' : ''}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-white">{pendientes.length}</p>
        <p className="text-xs text-zinc-500">sin pagar</p>
      </div>
    </div>
  );
};

// ---- Modal para registrar planilla ----
interface ModalPlanillaProps {
  tipoInicial: TipoServicio;
  onCerrar:    () => void;
  onGuardar:   (planilla: Omit<Planilla, 'id' | 'estado'>) => void;
}

const ModalPlanilla: React.FC<ModalPlanillaProps> = ({ tipoInicial, onCerrar, onGuardar }) => {
  const ahora = new Date();
  const [tipo, setTipo] = useState<TipoServicio>(tipoInicial);
  const [referencia, setReferencia] = useState<string>(
    tipoInicial === 'agua' ? 'General Edificio' : 'Piso 1'
  );
  const [periodoMes,    setPeriodoMes]    = useState(ahora.getMonth() + 1);
  const [periodoAnio,   setPeriodoAnio]   = useState(ahora.getFullYear());
  const [lectAnt,       setLectAnt]       = useState('');
  const [lectAct,       setLectAct]       = useState('');
  const [monto,         setMonto]         = useState('');
  const [vencimiento,   setVencimiento]   = useState('');
  const [numeroBoleta,  setNumeroBoleta]  = useState('');

  // Al cambiar tipo, actualizar referencia por defecto
  const handleTipo = (t: TipoServicio) => {
    setTipo(t);
    setReferencia(t === 'agua' ? 'General Edificio' : 'Piso 1');
  };

  const consumo = lectAnt && lectAct ? Number(lectAct) - Number(lectAnt) : undefined;

  const handleGuardar = () => {
    if (!monto || !vencimiento) return;
    onGuardar({
      tipo, referencia,
      periodoMes, periodoAnio,
      lecturaAnterior: lectAnt ? Number(lectAnt) : undefined,
      lecturaActual:   lectAct ? Number(lectAct) : undefined,
      consumo,
      monto:            Number(monto),
      fechaVencimiento: vencimiento,
      numeroBoleta:     numeroBoleta || undefined,
    });
  };

  const referencias = tipo === 'agua' ? REFERENCIAS_AGUA : REFERENCIAS_LUZ;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Registrar Planilla</h2>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tipo de servicio */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Tipo de servicio</label>
            <div className="grid grid-cols-2 gap-2">
              {(['agua', 'luz'] as TipoServicio[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTipo(t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    tipo === t
                      ? t === 'agua'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {t === 'agua' ? '💧 Agua' : '⚡ Luz / Electricidad'}
                </button>
              ))}
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-referencia">
              {tipo === 'agua' ? 'Planilla' : 'Piso'}
            </label>
            <select
              id="modal-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
            >
              {referencias.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-mes">Mes</label>
              <select
                id="modal-mes"
                value={periodoMes}
                onChange={(e) => setPeriodoMes(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
              >
                {MESES_COMPLETOS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-anio">Año</label>
              <select
                id="modal-anio"
                value={periodoAnio}
                onChange={(e) => setPeriodoAnio(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Lecturas de medidor (opcional) */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">
              Lecturas de medidor <span className="text-zinc-600">(opcional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1" htmlFor="modal-lect-ant">Lectura anterior</label>
                <input
                  id="modal-lect-ant"
                  type="number"
                  value={lectAnt}
                  onChange={(e) => setLectAnt(e.target.value)}
                  placeholder="0.000"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1" htmlFor="modal-lect-act">Lectura actual</label>
                <input
                  id="modal-lect-act"
                  type="number"
                  value={lectAct}
                  onChange={(e) => setLectAct(e.target.value)}
                  placeholder="0.000"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-zinc-600"
                />
              </div>
            </div>
            {consumo !== undefined && consumo > 0 && (
              <p className="text-xs text-violet-400 mt-1.5">
                Consumo calculado: <strong>{consumo.toFixed(3)}</strong> {tipo === 'agua' ? 'm³' : 'kWh'}
              </p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-monto">
              Monto a pagar (CLP) <span className="text-red-400">*</span>
            </label>
            <input
              id="modal-monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-zinc-600"
            />
          </div>

          {/* Vencimiento + N° Boleta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-vencimiento">
                Fecha vencimiento <span className="text-red-400">*</span>
              </label>
              <input
                id="modal-vencimiento"
                type="date"
                value={vencimiento}
                onChange={(e) => setVencimiento(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-boleta">
                N° Boleta / Factura
              </label>
              <input
                id="modal-boleta"
                type="text"
                value={numeroBoleta}
                onChange={(e) => setNumeroBoleta(e.target.value)}
                placeholder="Ej: A-2026-007"
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-guardar-planilla"
            onClick={handleGuardar}
            disabled={!monto || !vencimiento}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            Registrar planilla
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ServiciosPage — componente principal
// ============================================================================
export function ServiciosPage() {
  const [tab, setTab]       = useState<TabActiva>('agua');
  const [planillas, setPlanillas] = useState<Planilla[]>(PLANILLAS_MOCK);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState<TipoServicio>('agua');

  const abrirModal = (tipo: TipoServicio) => {
    setTipoModal(tipo);
    setModalAbierto(true);
  };

  const marcarPagado = (id: string) => {
    setPlanillas((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, estado: 'pagado', fechaPago: new Date().toISOString().split('T')[0] } : p
      )
    );
  };

  const agregarPlanilla = (datos: Omit<Planilla, 'id' | 'estado'>) => {
    const nueva: Planilla = {
      ...datos,
      id:     `nuevo-${Date.now()}`,
      estado: 'pendiente',
    };
    setPlanillas((prev) => [nueva, ...prev]);
    setModalAbierto(false);
  };

  // Filtrar por tab
  const planillasAgua = planillas.filter(p => p.tipo === 'agua');
  const planillasLuz  = planillas.filter(p => p.tipo === 'luz');

  const planillasVista = tab === 'agua'
    ? planillasAgua
    : tab === 'luz'
      ? planillasLuz
      : planillas; // historial = todas

  // Solo pendientes/vencidas para la vista principal, historial para todas
  const planillasMostrar = tab === 'historial'
    ? planillasVista.filter(p => p.estado === 'pagado')
    : planillasVista;

  // Agrupar luz por referencia para mostrar como secciones
  const pisos = ['Piso 1', 'Piso 2', 'Piso 3'];

  const colHeaders = ['Período', 'Referencia', 'Medidor', 'Monto', 'Vencimiento', 'Pagado el', 'Estado', ''];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Servicios Básicos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Agua y Electricidad — Casa Pisulli</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-registrar-agua"
            onClick={() => abrirModal('agua')}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600/80 hover:bg-blue-500
              text-white text-sm font-semibold rounded-xl transition-colors border border-blue-500/30"
          >
            <span>💧</span> Registrar agua
          </button>
          <button
            id="btn-registrar-luz"
            onClick={() => abrirModal('luz')}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600/80 hover:bg-amber-500
              text-white text-sm font-semibold rounded-xl transition-colors border border-amber-500/30"
          >
            <span>⚡</span> Registrar luz
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <ResumenServicio tipo="agua" planillas={planillasAgua} />
        <ResumenServicio tipo="luz"  planillas={planillasLuz}  />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-white/5 w-fit mb-6">
        {([
          { id: 'agua',      label: '💧 Agua' },
          { id: 'luz',       label: '⚡ Luz' },
          { id: 'historial', label: '📋 Historial pagados' },
        ] as { id: TabActiva; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Vista de LUZ: agrupada por piso */}
      {tab === 'luz' ? (
        <div className="space-y-4">
          {pisos.map((piso) => {
            const planillasPiso = planillasMostrar.filter(p => p.referencia === piso);
            const pendientesPiso = planillasPiso.filter(p => p.estado !== 'pagado');
            return (
              <div key={piso} className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
                {/* Cabecera del piso */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-amber-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Luz — {piso}</p>
                      <p className="text-xs text-zinc-500">{planillasPiso.length} registro{planillasPiso.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {pendientesPiso.length > 0 && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      {pendientesPiso.length} pendiente{pendientesPiso.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {colHeaders.map((col) => (
                          <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {planillasPiso.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-zinc-600">
                            Sin registros para {piso}
                          </td>
                        </tr>
                      ) : (
                        planillasPiso.map((p) => (
                          <FilaPlanilla key={p.id} planilla={p} onMarcarPagado={marcarPagado} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista de AGUA e HISTORIAL: tabla única */
        <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
          {tab === 'agua' && (
            <div className="flex items-center gap-3 px-6 py-3.5 border-b border-white/5 bg-blue-500/5">
              <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 2C6.5 2 2 7.5 2 13a10 10 0 0020 0c0-5.5-4.5-11-10-11z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Agua — General Edificio</p>
                <p className="text-xs text-zinc-500">1 planilla mensual compartida</p>
              </div>
            </div>
          )}
          {tab === 'historial' && (
            <div className="px-6 py-3.5 border-b border-white/5">
              <p className="text-sm font-semibold text-white">Historial de planillas pagadas</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {planillasMostrar.length} registro{planillasMostrar.length !== 1 ? 's' : ''} · Todos los servicios
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {colHeaders.map((col) => (
                    <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planillasMostrar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <p className="text-sm text-zinc-500">Sin registros en esta categoría</p>
                    </td>
                  </tr>
                ) : (
                  planillasMostrar.map((p) => (
                    <FilaPlanilla key={p.id} planilla={p} onMarcarPagado={marcarPagado} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalPlanilla
          tipoInicial={tipoModal}
          onCerrar={() => setModalAbierto(false)}
          onGuardar={agregarPlanilla}
        />
      )}
    </div>
  );
}
