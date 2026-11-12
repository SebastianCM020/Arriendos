// =============================================================================
// DOMINIO: Entidad Transacción (ingresos y gastos)
// =============================================================================

export type TipoTransaccion = 'ingreso' | 'egreso';
export type EstadoTransaccion = 'pagado' | 'pendiente' | 'vencido' | 'anulado';
export type MetodoPago = 'transferencia' | 'efectivo' | 'cheque' | 'otro';

export interface CategoriaTransaccion {
  id: string;
  nombre: string;
  tipo: TipoTransaccion;
  descripcion?: string;
  icono?: string;
}

export interface Transaccion {
  id: string;
  contratoId?: string;
  categoriaId: string;
  categoria?: CategoriaTransaccion;
  tipo: TipoTransaccion;
  monto: number;
  fechaEmision: string;     // ISO date
  fechaVencimiento?: string;
  fechaPago?: string;
  estado: EstadoTransaccion;
  metodoPago?: MetodoPago;
  periodoMes?: number;       // 1-12
  periodoAnio?: number;
  numeroReferencia?: string;
  descripcion?: string;
  notas?: string;
  adjuntos?: Adjunto[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface Adjunto {
  id: string;
  transaccionId: string;
  nombreArchivo: string;
  rutaStorage: string;
  urlPublica?: string;
  tipoMime: string;
  tamanioBytes?: number;
  descripcion?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type CrearTransaccionDTO = Omit<Transaccion, 'id' | 'categoria' | 'adjuntos' | 'creadoEn' | 'actualizadoEn'>;
export type ActualizarTransaccionDTO = Partial<CrearTransaccionDTO>;

// DTO para el dashboard
export interface MetricasDashboard {
  ingresosDelMes: number;
  facturasPendientes: number;
  facturasVencidas: number;
  inquilinosMorosos: number;
  propiedadesOcupadas: number;
  propiedadesDisponibles: number;
}

export interface TransaccionResumen {
  id: string;
  inquilinoNombre: string;
  propiedadNombre: string;
  categorianombre: string;
  tipo: TipoTransaccion;
  monto: number;
  estado: EstadoTransaccion;
  fechaVencimiento?: string;
  fechaPago?: string;
}
