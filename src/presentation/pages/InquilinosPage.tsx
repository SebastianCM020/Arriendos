// =============================================================================
// PRESENTACIÓN: InquilinosPage — Con modal de edición completo
// =============================================================================

import React, { useState } from 'react';

type EstadoInquilino = 'activo' | 'moroso' | 'inactivo';

interface Inquilino {
  id:                string;
  nombre:            string;
  rut:               string;
  correo:            string;
  telefono:          string;
  telefonoEmergencia?: string;
  nombreEmergencia?:   string;
  estado:            EstadoInquilino;
  propiedad:         string;
  notas?:            string;
}

const DATOS_INICIALES: Inquilino[] = [
  {
    id:                 '1',
    nombre:             'Carlos Mendoza Rojas',
    rut:                '12.345.678-9',
    correo:             'carlos.mendoza@gmail.com',
    telefono:           '+56 9 8765 4321',
    telefonoEmergencia: '+56 9 1234 5678',
    nombreEmergencia:   'Rosa Rojas (madre)',
    estado:             'activo',
    propiedad:          'Casa Pisulli',
    notas:              '',
  },
];

const ESTADO_CFG: Record<EstadoInquilino, { texto: string; clases: string }> = {
  activo:   { texto: 'Activo',   clases: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  moroso:   { texto: 'Moroso',   clases: 'bg-red-500/15     text-red-400     border border-red-500/30'    },
  inactivo: { texto: 'Inactivo', clases: 'bg-zinc-500/15    text-zinc-400    border border-zinc-500/30'   },
};

// ---- Modal de edición / creación ----
interface ModalInquilinoProps {
  inquilino?: Inquilino;
  onCerrar:  () => void;
  onGuardar: (datos: Omit<Inquilino, 'id'>) => void;
}

const ModalInquilino: React.FC<ModalInquilinoProps> = ({ inquilino, onCerrar, onGuardar }) => {
  const [nombre,    setNombre]    = useState(inquilino?.nombre    ?? '');
  const [rut,       setRut]       = useState(inquilino?.rut       ?? '');
  const [correo,    setCorreo]    = useState(inquilino?.correo    ?? '');
  const [telefono,  setTelefono]  = useState(inquilino?.telefono  ?? '');
  const [telEmerg,  setTelEmerg]  = useState(inquilino?.telefonoEmergencia ?? '');
  const [nomEmerg,  setNomEmerg]  = useState(inquilino?.nombreEmergencia   ?? '');
  const [estado,    setEstado]    = useState<EstadoInquilino>(inquilino?.estado ?? 'activo');
  const [notas,     setNotas]     = useState(inquilino?.notas     ?? '');

  const esEdicion = !!inquilino;

  const handleGuardar = () => {
    if (!nombre.trim() || !rut.trim()) return;
    onGuardar({
      nombre: nombre.trim(),
      rut:    rut.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      telefonoEmergencia: telEmerg.trim() || undefined,
      nombreEmergencia:   nomEmerg.trim() || undefined,
      estado,
      propiedad: 'Casa Pisulli',
      notas:     notas.trim() || undefined,
    });
  };

  const campoInput = (
    id: string, label: string, value: string,
    onChange: (v: string) => void,
    opciones?: { type?: string; placeholder?: string; required?: boolean }
  ) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor={id}>
        {label}{opciones?.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={opciones?.type ?? 'text'} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opciones?.placeholder}
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
            {esEdicion ? 'Editar Inquilino' : 'Nuevo Inquilino'}
          </h2>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {campoInput('inq-nombre', 'Nombre completo', nombre, setNombre, { required: true, placeholder: 'Juan Pérez González' })}
          {campoInput('inq-rut', 'RUT', rut, setRut, { required: true, placeholder: '12.345.678-9' })}

          <div className="grid grid-cols-2 gap-3">
            {campoInput('inq-correo', 'Correo electrónico', correo, setCorreo, { type: 'email', placeholder: 'correo@ejemplo.com' })}
            {campoInput('inq-telefono', 'Teléfono', telefono, setTelefono, { placeholder: '+56 9 1234 5678' })}
          </div>

          {/* Emergencia */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-white/5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacto de emergencia</p>
            <div className="grid grid-cols-2 gap-3">
              {campoInput('inq-nom-emerg', 'Nombre y relación', nomEmerg, setNomEmerg, { placeholder: 'María Pérez (madre)' })}
              {campoInput('inq-tel-emerg', 'Teléfono', telEmerg, setTelEmerg, { placeholder: '+56 9 9876 5432' })}
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="inq-estado">Estado</label>
            <select
              id="inq-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoInquilino)}
              className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
            >
              <option value="activo">Activo</option>
              <option value="moroso">Moroso</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="inq-notas">Notas internas</label>
            <textarea
              id="inq-notas" rows={3} value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones sobre el inquilino..."
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
            id="btn-guardar-inquilino"
            onClick={handleGuardar}
            disabled={!nombre.trim() || !rut.trim()}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            {esEdicion ? 'Guardar cambios' : 'Crear inquilino'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// InquilinosPage
// ============================================================================
export function InquilinosPage() {
  const [inquilinos, setInquilinos]   = useState<Inquilino[]>(DATOS_INICIALES);
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [inquilinoEditar, setInquilinoEditar] = useState<Inquilino | undefined>(undefined);

  const abrirNuevo   = () => { setInquilinoEditar(undefined); setModalAbierto(true); };
  const abrirEdicion = (inq: Inquilino) => { setInquilinoEditar(inq); setModalAbierto(true); };
  const cerrarModal  = () => { setModalAbierto(false); setInquilinoEditar(undefined); };

  const guardar = (datos: Omit<Inquilino, 'id'>) => {
    if (inquilinoEditar) {
      setInquilinos(prev => prev.map(i => i.id === inquilinoEditar.id ? { ...i, ...datos } : i));
    } else {
      setInquilinos(prev => [...prev, { ...datos, id: `inq-${Date.now()}` }]);
    }
    cerrarModal();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inquilinos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {inquilinos.length} inquilino{inquilinos.length !== 1 ? 's' : ''} registrado{inquilinos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-nuevo-inquilino"
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500
            text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo inquilino
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Inquilino', 'RUT', 'Contacto', 'Emergencia', 'Propiedad', 'Estado', 'Acciones'].map((col) => (
                  <th key={col} className="py-3 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquilinos.map((inq) => {
                const { texto, clases } = ESTADO_CFG[inq.estado];
                return (
                  <tr key={inq.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500/20 to-indigo-500/20
                          border border-violet-500/20 rounded-xl flex items-center justify-center
                          text-sm font-bold text-violet-300 flex-shrink-0">
                          {inq.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{inq.nombre}</p>
                          {inq.notas && <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-[150px]">{inq.notas}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-400 font-mono">{inq.rut}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">{inq.correo}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{inq.telefono}</p>
                    </td>
                    <td className="py-4 px-4">
                      {inq.nombreEmergencia ? (
                        <>
                          <p className="text-xs text-zinc-300">{inq.nombreEmergencia}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{inq.telefonoEmergencia}</p>
                        </>
                      ) : <p className="text-xs text-zinc-600">—</p>}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-zinc-300">{inq.propiedad}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clases}`}>
                        {texto}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => abrirEdicion(inq)}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-violet-400
                          transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10 border border-transparent
                          hover:border-violet-500/20"
                        title="Editar inquilino"
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
        <ModalInquilino
          inquilino={inquilinoEditar}
          onCerrar={cerrarModal}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}
