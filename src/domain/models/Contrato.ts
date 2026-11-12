// =============================================================================
// DOMINIO: Entidad Contrato
// =============================================================================

export type EstadoContrato = 'vigente' | 'terminado' | 'suspendido';

export interface Contrato {
  id: string;
  propiedadId: string;
  inquilinoId: string;
  fechaInicio: string;   // ISO date
  fechaTermino: string;  // ISO date
  montoArriendo: number;
  diaCobro: number;      // 1-28
  mesesGarantia: number;
  montoGarantia: number;
  incluyeAgua: boolean;
  incluyeLuz: boolean;
  reajusteIPC: boolean;
  estado: EstadoContrato;
  documentoUrl?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type CrearContratoDTO = Omit<Contrato, 'id' | 'creadoEn' | 'actualizadoEn'>;
export type ActualizarContratoDTO = Partial<CrearContratoDTO>;
