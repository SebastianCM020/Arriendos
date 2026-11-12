// =============================================================================
// DOMINIO: Interfaces de Repositorios (puertos)
// Define el contrato que deben cumplir las implementaciones de infraestructura
// =============================================================================

import type { Transaccion, CrearTransaccionDTO, ActualizarTransaccionDTO, MetricasDashboard, TransaccionResumen } from './models/Transaccion';
import type { Propiedad, CrearPropiedadDTO, ActualizarPropiedadDTO } from './models/Propiedad';
import type { Inquilino, CrearInquilinoDTO, ActualizarInquilinoDTO } from './models/Inquilino';
import type { Contrato, CrearContratoDTO, ActualizarContratoDTO } from './models/Contrato';

// Paginación genérica
export interface PaginacionOpciones {
  pagina: number;
  porPagina: number;
}

export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// ---- Repositorio de Transacciones ----
export interface ITransaccionRepository {
  obtenerTodas(opciones?: PaginacionOpciones): Promise<ResultadoPaginado<Transaccion>>;
  obtenerPorId(id: string): Promise<Transaccion | null>;
  obtenerPorContrato(contratoId: string): Promise<Transaccion[]>;
  obtenerPendientes(): Promise<Transaccion[]>;
  obtenerResumenDashboard(mes: number, anio: number): Promise<TransaccionResumen[]>;
  obtenerMetricas(mes: number, anio: number): Promise<MetricasDashboard>;
  crear(dto: CrearTransaccionDTO): Promise<Transaccion>;
  actualizar(id: string, dto: ActualizarTransaccionDTO): Promise<Transaccion>;
  eliminar(id: string): Promise<void>;
  subirAdjunto(transaccionId: string, archivo: File): Promise<string>;
}

// ---- Repositorio de Propiedades ----
export interface IPropiedadRepository {
  obtenerTodas(opciones?: PaginacionOpciones): Promise<ResultadoPaginado<Propiedad>>;
  obtenerPorId(id: string): Promise<Propiedad | null>;
  crear(dto: CrearPropiedadDTO): Promise<Propiedad>;
  actualizar(id: string, dto: ActualizarPropiedadDTO): Promise<Propiedad>;
  eliminar(id: string): Promise<void>;
}

// ---- Repositorio de Inquilinos ----
export interface IInquilinoRepository {
  obtenerTodos(opciones?: PaginacionOpciones): Promise<ResultadoPaginado<Inquilino>>;
  obtenerPorId(id: string): Promise<Inquilino | null>;
  obtenerMorosos(): Promise<Inquilino[]>;
  crear(dto: CrearInquilinoDTO): Promise<Inquilino>;
  actualizar(id: string, dto: ActualizarInquilinoDTO): Promise<Inquilino>;
  eliminar(id: string): Promise<void>;
}

// ---- Repositorio de Contratos ----
export interface IContratoRepository {
  obtenerTodos(opciones?: PaginacionOpciones): Promise<ResultadoPaginado<Contrato>>;
  obtenerPorId(id: string): Promise<Contrato | null>;
  obtenerVigentes(): Promise<Contrato[]>;
  crear(dto: CrearContratoDTO): Promise<Contrato>;
  actualizar(id: string, dto: ActualizarContratoDTO): Promise<Contrato>;
  terminar(id: string): Promise<Contrato>;
}
