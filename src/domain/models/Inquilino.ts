// =============================================================================
// DOMINIO: Entidad Inquilino
// =============================================================================

export type EstadoInquilino = 'activo' | 'moroso' | 'inactivo';

export interface Inquilino {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string; // computed: nombre + apellido
  rut: string;
  correo?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  nombreEmergencia?: string;
  direccionAnterior?: string;
  estado: EstadoInquilino;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type CrearInquilinoDTO = Omit<Inquilino, 'id' | 'nombreCompleto' | 'creadoEn' | 'actualizadoEn'>;
export type ActualizarInquilinoDTO = Partial<CrearInquilinoDTO>;
