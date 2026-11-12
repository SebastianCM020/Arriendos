// =============================================================================
// DOMINIO: Entidad Propiedad
// =============================================================================

export type EstadoPropiedad = 'disponible' | 'arrendada' | 'mantenimiento' | 'inactiva';

export interface Comuna {
  id: string;
  nombre: string;
  region: string;
}

export interface Propiedad {
  id: string;
  nombre: string;
  direccion: string;
  numero?: string;
  piso?: string;
  departamento?: string;
  comunaId: string;
  comuna?: Comuna;
  tipo: 'casa' | 'departamento' | 'local' | 'bodega';
  metrosCuadrados?: number;
  numeroHabitaciones?: number;
  numeroBanos?: number;
  precioArriendoBase: number;
  estado: EstadoPropiedad;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type CrearPropiedadDTO = Omit<Propiedad, 'id' | 'creadoEn' | 'actualizadoEn' | 'comuna'>;
export type ActualizarPropiedadDTO = Partial<CrearPropiedadDTO>;
