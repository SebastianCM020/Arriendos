// =============================================================================
// PRESENTACIÓN: ContratosPage — Con modal de edición completo
// =============================================================================

import React, { useState } from 'react';

type EstadoContrato = 'vigente' | 'terminado' | 'suspendido';

interface Contrato {
  id:           string;
  inquilino:    string;
  propiedad:    string;
  fechaInicio:  string;
  fechaTermino: string;
  monto:        number;
  diaCobro:     number;
  mesesGarantia:  number;
  montoGarantia:  number;
  incluyeAgua:  boolean;
  incluyeLuz:   boolean;
  estado:       EstadoContrato;
  notas?:       string;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const formatFecha = (f: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(f + 'T00:00:00'));

const DATOS_INICIALES: Contrato[] = [
  {
    id: '1',
    inquilino:   'Carlos Mendoza Rojas',
    propiedad:   'Casa Pisulli',
    fechaInicio: '2025-01-01',
    fechaTermino:'2025-12-31',
    monto:       750_000,
    diaCobro:    5,
    mesesGarantia: 1,
    montoGarantia: 750_000,
    incluyeAgua: false,
    incluyeLuz:  false,
    estado:      'vigente',
  },
];

const ESTADO_CFG: Record<EstadoContrato, { texto: string; clases: string }> = {
  vigente:    { texto: 'Vigente',    clases: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  terminado:  { texto: 'Terminado',  clases: 'bg-zinc-500/15    text-zinc-400    border border-zinc-500/30'   },
  suspendido: { texto: 'Suspendido', clases: 'bg-amber-500/15   text-amber-400   border border-amber-500/30'  },
};

// ---- Modal ----
interface ModalContratoProps {
  contrato?: Contrato;
  onCerrar:  () => void;
  onGuardar: (datos: Omit<Contrato, 'id'>) => void;
}

const ModalContrato: React.FC<ModalContratoProps> = ({ contrato, onCerrar, onGuardar }) => {
  const [monto,         setMonto]         = useState(String(contrato?.monto         ?? ''));
  const [fechaInicio,   setFechaInicio]   = useState(contrato?.fechaInicio           ?? '');
  const [fechaTermino,  setFechaTermino]  = useState(contrato?.fechaTermino          ?? '');
  const [diaCobro,      setDiaCobro]      = useState(String(contrato?.diaCobro       ?? '5'));
  const [mesesGarantia, setMesesGarantia] = useState(String(contrato?.mesesGarantia  ?? '1'));
  const [montoGarantia, setMontoGarantia] = useState(String(contrato?.montoGarantia  ?? ''));
  const [incluyeAgua,   setIncluyeAgua]   = useState(contrato?.incluyeAgua           ?? false);
  const [incluyeLuz,    setIncluyeLuz]    = useState(contrato?.incluyeLuz            ?? false);
  const [estado,        setEstado]        = useState<EstadoContrato>(contrato?.estado ?? 'vigente');
  const [notas,         setNotas]         = useState(contrato?.notas                 ?? '');

  const esValido = monto && fechaInicio && fechaTermino && diaCobro;

  const handleGuardar = () => {
    if (!esValido) return;
    onGuardar({
      inquilino:    contrato?.inquilino    ?? 'Carlos Mendoza Rojas',
      propiedad:    contrato?.propiedad    ?? 'Casa Pisulli',
      fechaInicio, fechaTermino,
      monto:         Number(monto),
      diaCobro:      Number(diaCobro),
      mesesGarantia: Number(mesesGarantia),
      montoGarantia: Number(montoGarantia) || Number(monto),
      incluyeAgua, incluyeLuz,
      estado,
      notas: notas.trim() || undefined,
    });
  };

  const labelInput = (
    id: string, label: string, value: string,
    onChange: (v: string) => void,
    type = 'text', placeholder?: string, required?: boolean
  ) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor={id}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input id={id} type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
          placeholder-zinc-600 transition-all"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">
            {contrato ? 'Editar Contrato' : 'Nuevo Contrato'}
          </h2>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Propiedad + Inquilino (informativos) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-2.5">
              <p className="text-xs text-zinc-500 mb-0.5">Propiedad</p>
              <p className="text-sm font-semibold text-white">{contrato?.propiedad ?? 'Casa Pisulli'}</p>
            </div>
            <div className="bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-2.5">
              <p className="text-xs text-zinc-500 mb-0.5">Inquilino</p>
              <p className="text-sm font-semibold text-white">{contrato?.inquilino ?? 'Carlos Mendoza Rojas'}</p>
            </div>
          </div>

          {/* Vigencia */}
          <div className="grid grid-cols-2 gap-3">
            {labelInput('ctr-inicio', 'Fecha inicio', fechaInicio, setFechaInicio, 'date', undefined, true)}
            {labelInput('ctr-termino', 'Fecha término', fechaTermino, setFechaTermino, 'date', undefined, true)}
          </div>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-3">
            {labelInput('ctr-monto', 'Monto arriendo (CLP)', monto, setMonto, 'number', '750000', true)}
            {labelInput('ctr-dia', 'Día de cobro (1-28)', diaCobro, setDiaCobro, 'number', '5', true)}
          </div>

          {/* Garantía */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-white/5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Garantía</p>
            <div className="grid grid-cols-2 gap-3">
              {labelInput('ctr-mes-gar', 'Meses de garantía', mesesGarantia, setMesesGarantia, 'number', '1')}
              {labelInput('ctr-monto-gar', 'Monto garantía (CLP)', montoGarantia, setMontoGarantia, 'number', '750000')}
            </div>
          </div>

          {/* Servicios incluidos */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Servicios incluidos en el arriendo</p>
            <div className="flex flex-col gap-2">
              {([
                { id: 'ctr-agua', label: 'Incluye agua', checked: incluyeAgua, onChange: setIncluyeAgua },
                { id: 'ctr-luz',  label: 'Incluye luz / electricidad', checked: incluyeLuz,  onChange: setIncluyeLuz  },
              ]).map((item) => (
                <label key={item.id} htmlFor={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50
                  border border-white/5 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input id={item.id} type="checkbox" checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-500"
                  />
                  <span className="text-sm text-zinc-300">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="ctr-estado">Estado del contrato</label>
            <select id="ctr-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoContrato)}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer">
              <option value="vigente">Vigente</option>
              <option value="terminado">Terminado</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="ctr-notas">Notas internas</label>
            <textarea id="ctr-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Cláusulas especiales, observaciones..."
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none placeholder-zinc-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onCerrar} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button
            id="btn-guardar-contrato"
            onClick={handleGuardar}
            disabled={!esValido}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            {contrato ? 'Guardar cambios' : 'Crear contrato'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ContratosPage
// ============================================================================
export function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>(DATOS_INICIALES);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [contratoEditar, setContratoEditar] = useState<Contrato | undefined>(undefined);

  const abrirNuevo    = () => { setContratoEditar(undefined); setModalAbierto(true); };
  const abrirEdicion  = (c: Contrato) => { setContratoEditar(c); setModalAbierto(true); };
  const cerrarModal   = () => { setModalAbierto(false); setContratoEditar(undefined); };

  const guardar = (datos: Omit<Contrato, 'id'>) => {
    if (contratoEditar) {
      setContratos(prev => prev.map(c => c.id === contratoEditar.id ? { ...c, ...datos } : c));
    } else {
      setContratos(prev => [...prev, { ...datos, id: `ctr-${Date.now()}` }]);
    }
    cerrarModal();
  };

  const vigentes = contratos.filter(c => c.estado === 'vigente').length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contratos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{vigentes} vigente{vigentes !== 1 ? 's' : ''} · {contratos.length} total</p>
        </div>
        <button
          id="btn-nuevo-contrato"
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500
            text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo contrato
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Inquilino','Propiedad','Vigencia','Monto mensual','Día cobro','Servicios','Estado','Acciones'].map((col) => (
                  <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => {
                const { texto, clases } = ESTADO_CFG[c.estado];
                return (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="py-4 px-4">
                      <p className="text-sm font-semibold text-white">{c.inquilino}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">{c.propiedad}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">{formatFecha(c.fechaInicio)}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">hasta {formatFecha(c.fechaTermino)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-bold text-emerald-400">{formatCLP(c.monto)}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Gtía: {formatCLP(c.montoGarantia)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">Día {c.diaCobro}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1.5">
                        {c.incluyeAgua && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-md border border-blue-500/20">
                            💧 Agua
                          </span>
                        )}
                        {c.incluyeLuz && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/20">
                            ⚡ Luz
                          </span>
                        )}
                        {!c.incluyeAgua && !c.incluyeLuz && (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clases}`}>
                        {texto}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => abrirEdicion(c)}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-violet-400
                          transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10 border border-transparent
                          hover:border-violet-500/20"
                        title="Editar contrato"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <ModalContrato contrato={contratoEditar} onCerrar={cerrarModal} onGuardar={guardar} />
      )}
    </div>
  );
}
