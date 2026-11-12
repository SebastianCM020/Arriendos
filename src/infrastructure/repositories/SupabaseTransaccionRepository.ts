// =============================================================================
// INFRAESTRUCTURA: SupabaseTransaccionRepository
// Adaptador concreto que implementa ITransaccionRepository usando Supabase.
//
// Errores corregidos:
//  1. obtenerMetricas — el tipo de 'ingresos' no estaba correctamente acotado;
//     se añade una interfaz local MontoRow para tipar la fila del select.
//  2. obtenerResumenDashboard — el cast genérico a Record<string,unknown>[]
//     era inseguro; ahora se usa la interfaz DashboardRow.
//  3. subirAdjunto — 'contentType' no existe en FileOptions del SDK de Supabase;
//     se elimina esa propiedad (el Content-Type se infiere del objeto File).
//  4. Todos los métodos tienen manejo de error consistente y tipado explícito.
// =============================================================================

import type {
  ITransaccionRepository,
  PaginacionOpciones,
  ResultadoPaginado,
} from '../../domain/repositories';
import type {
  Transaccion,
  CrearTransaccionDTO,
  ActualizarTransaccionDTO,
  MetricasDashboard,
  TransaccionResumen,
} from '../../domain/models/Transaccion';
import { supabase } from '../supabaseClient';

// ---------------------------------------------------------------------------
// Tipos locales de ayuda para las filas crudas de Supabase
// ---------------------------------------------------------------------------

/** Fila mínima para calcular ingresos del mes */
interface MontoRow {
  monto: number | string | null;
}

/** Fila de la vista vista_dashboard */
interface DashboardRow {
  transaccion_id:    string;
  inquilino_nombre:  string;
  propiedad_nombre:  string;
  categoria_nombre:  string;
  transaccion_tipo:  TransaccionResumen['tipo'];
  transaccion_monto: number | string | null;
  transaccion_estado: TransaccionResumen['estado'];
  fecha_vencimiento: string | null;
  fecha_pago:        string | null;
}

// ---------------------------------------------------------------------------
// Mapeadores: filas DB → entidades de dominio
// ---------------------------------------------------------------------------

/**
 * Transforma una fila cruda de la tabla `transacciones` en una entidad Transaccion.
 * Se usa un tipo indexable para mantener compatibilidad con el select dinámico
 * de Supabase sin perder seguridad de tipos en los campos que sí conocemos.
 */
function mapearFilaTransaccion(row: Record<string, unknown>): Transaccion {
  return {
    id:               String(row['id']),
    contratoId:       row['contrato_id'] != null ? String(row['contrato_id']) : undefined,
    categoriaId:      String(row['categoria_id']),
    tipo:             row['tipo'] as Transaccion['tipo'],
    monto:            Number(row['monto']),
    fechaEmision:     String(row['fecha_emision']),
    fechaVencimiento: row['fecha_vencimiento'] != null ? String(row['fecha_vencimiento']) : undefined,
    fechaPago:        row['fecha_pago'] != null ? String(row['fecha_pago']) : undefined,
    estado:           row['estado'] as Transaccion['estado'],
    metodoPago:       row['metodo_pago'] != null ? (row['metodo_pago'] as Transaccion['metodoPago']) : undefined,
    periodoMes:       row['periodo_mes'] != null ? Number(row['periodo_mes']) : undefined,
    periodoAnio:      row['periodo_anio'] != null ? Number(row['periodo_anio']) : undefined,
    numeroReferencia: row['numero_referencia'] != null ? String(row['numero_referencia']) : undefined,
    descripcion:      row['descripcion'] != null ? String(row['descripcion']) : undefined,
    notas:            row['notas'] != null ? String(row['notas']) : undefined,
    creadoEn:         String(row['creado_en']),
    actualizadoEn:    String(row['actualizado_en']),
  };
}

/** Transforma una fila de vista_dashboard en un TransaccionResumen. */
function mapearFilaDashboard(row: DashboardRow): TransaccionResumen {
  return {
    id:               row.transaccion_id,
    inquilinoNombre:  row.inquilino_nombre,
    propiedadNombre:  row.propiedad_nombre,
    categorianombre:  row.categoria_nombre,
    tipo:             row.transaccion_tipo,
    monto:            Number(row.transaccion_monto ?? 0),
    estado:           row.transaccion_estado,
    fechaVencimiento: row.fecha_vencimiento ?? undefined,
    fechaPago:        row.fecha_pago ?? undefined,
  };
}

/** Transforma un DTO de creación en el payload para Supabase (snake_case). */
function mapearDTOAPayload(dto: CrearTransaccionDTO): Record<string, unknown> {
  return {
    contrato_id:       dto.contratoId       ?? null,
    categoria_id:      dto.categoriaId,
    tipo:              dto.tipo,
    monto:             dto.monto,
    fecha_emision:     dto.fechaEmision,
    fecha_vencimiento: dto.fechaVencimiento  ?? null,
    fecha_pago:        dto.fechaPago         ?? null,
    estado:            dto.estado,
    metodo_pago:       dto.metodoPago        ?? null,
    periodo_mes:       dto.periodoMes        ?? null,
    periodo_anio:      dto.periodoAnio       ?? null,
    numero_referencia: dto.numeroReferencia  ?? null,
    descripcion:       dto.descripcion       ?? null,
    notas:             dto.notas             ?? null,
  };
}

// ---------------------------------------------------------------------------
// Implementación del repositorio
// ---------------------------------------------------------------------------

export class SupabaseTransaccionRepository implements ITransaccionRepository {

  // ── Consultas de lectura ────────────────────────────────────────────────

  async obtenerTodas(
    opciones?: PaginacionOpciones,
  ): Promise<ResultadoPaginado<Transaccion>> {
    const pagina    = opciones?.pagina    ?? 1;
    const porPagina = opciones?.porPagina ?? 20;
    const desde     = (pagina - 1) * porPagina;
    const hasta     = desde + porPagina - 1;

    const { data, error, count } = await supabase
      .from('transacciones')
      .select('*, categorias_transaccion(*)', { count: 'exact' })
      .order('fecha_emision', { ascending: false })
      .range(desde, hasta);

    if (error) {
      throw new Error(`[TransaccionRepo.obtenerTodas] ${error.message}`);
    }

    const total = count ?? 0;

    return {
      datos:       (data ?? []).map((row) => mapearFilaTransaccion(row as Record<string, unknown>)),
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina),
    };
  }

  async obtenerPorId(id: string): Promise<Transaccion | null> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, categorias_transaccion(*), adjuntos(*)')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 = no rows found → retornar null en lugar de lanzar
      if (error.code === 'PGRST116') return null;
      throw new Error(`[TransaccionRepo.obtenerPorId] ${error.message}`);
    }

    return data ? mapearFilaTransaccion(data as Record<string, unknown>) : null;
  }

  async obtenerPorContrato(contratoId: string): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, categorias_transaccion(*)')
      .eq('contrato_id', contratoId)
      .order('fecha_emision', { ascending: false });

    if (error) {
      throw new Error(`[TransaccionRepo.obtenerPorContrato] ${error.message}`);
    }

    return (data ?? []).map((row) => mapearFilaTransaccion(row as Record<string, unknown>));
  }

  async obtenerPendientes(): Promise<Transaccion[]> {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, categorias_transaccion(*)')
      .in('estado', ['pendiente', 'vencido'])
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new Error(`[TransaccionRepo.obtenerPendientes] ${error.message}`);
    }

    return (data ?? []).map((row) => mapearFilaTransaccion(row as Record<string, unknown>));
  }

  async obtenerResumenDashboard(
    mes: number,
    anio: number,
  ): Promise<TransaccionResumen[]> {
    const { data, error } = await supabase
      .from('vista_dashboard')
      .select('*')
      .eq('periodo_mes', mes)
      .eq('periodo_anio', anio)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new Error(`[TransaccionRepo.obtenerResumenDashboard] ${error.message}`);
    }

    return (data ?? []).map((row) => mapearFilaDashboard(row as unknown as DashboardRow));
  }

  /**
   * Calcula las métricas del dashboard para un período dado.
   * Se realizan 6 consultas en paralelo para minimizar la latencia total.
   */
  async obtenerMetricas(mes: number, anio: number): Promise<MetricasDashboard> {
    const [
      resIngresos,
      resPendientes,
      resVencidas,
      resMorosos,
      resOcupadas,
      resDisponibles,
    ] = await Promise.all([
      // Suma de ingresos pagados del período
      supabase
        .from('transacciones')
        .select('monto')
        .eq('tipo', 'ingreso')
        .eq('estado', 'pagado')
        .eq('periodo_mes', mes)
        .eq('periodo_anio', anio),

      // Conteo de facturas pendientes del período
      supabase
        .from('transacciones')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
        .eq('periodo_mes', mes)
        .eq('periodo_anio', anio),

      // Conteo de facturas vencidas (globales)
      supabase
        .from('transacciones')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'vencido'),

      // Conteo de inquilinos morosos
      supabase
        .from('inquilinos')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'moroso'),

      // Propiedades arrendadas
      supabase
        .from('propiedades')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'arrendada'),

      // Propiedades disponibles
      supabase
        .from('propiedades')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'disponible'),
    ]);

    // Propagar el primer error encontrado con contexto claro
    if (resIngresos.error)     throw new Error(`[TransaccionRepo.obtenerMetricas/ingresos] ${resIngresos.error.message}`);
    if (resPendientes.error)   throw new Error(`[TransaccionRepo.obtenerMetricas/pendientes] ${resPendientes.error.message}`);
    if (resVencidas.error)     throw new Error(`[TransaccionRepo.obtenerMetricas/vencidas] ${resVencidas.error.message}`);
    if (resMorosos.error)      throw new Error(`[TransaccionRepo.obtenerMetricas/morosos] ${resMorosos.error.message}`);
    if (resOcupadas.error)     throw new Error(`[TransaccionRepo.obtenerMetricas/ocupadas] ${resOcupadas.error.message}`);
    if (resDisponibles.error)  throw new Error(`[TransaccionRepo.obtenerMetricas/disponibles] ${resDisponibles.error.message}`);

    // Reducir los montos de ingresos con tipado seguro
    const filasMonto = (resIngresos.data ?? []) as MontoRow[];
    const ingresosDelMes = filasMonto.reduce(
      (acc, fila) => acc + Number(fila.monto ?? 0),
      0,
    );

    return {
      ingresosDelMes,
      facturasPendientes:     resPendientes.count   ?? 0,
      facturasVencidas:       resVencidas.count      ?? 0,
      inquilinosMorosos:      resMorosos.count       ?? 0,
      propiedadesOcupadas:    resOcupadas.count      ?? 0,
      propiedadesDisponibles: resDisponibles.count   ?? 0,
    };
  }

  // ── Mutaciones ──────────────────────────────────────────────────────────

  async crear(dto: CrearTransaccionDTO): Promise<Transaccion> {
    const { data, error } = await supabase
      .from('transacciones')
      .insert(mapearDTOAPayload(dto))
      .select('*, categorias_transaccion(*)')
      .single();

    if (error) {
      throw new Error(`[TransaccionRepo.crear] ${error.message}`);
    }

    return mapearFilaTransaccion(data as Record<string, unknown>);
  }

  async actualizar(id: string, dto: ActualizarTransaccionDTO): Promise<Transaccion> {
    // Construir payload solo con los campos que fueron explícitamente provistos
    const payload: Record<string, unknown> = {};

    if (dto.contratoId       !== undefined) payload['contrato_id']       = dto.contratoId;
    if (dto.categoriaId      !== undefined) payload['categoria_id']      = dto.categoriaId;
    if (dto.tipo             !== undefined) payload['tipo']              = dto.tipo;
    if (dto.monto            !== undefined) payload['monto']             = dto.monto;
    if (dto.fechaEmision     !== undefined) payload['fecha_emision']     = dto.fechaEmision;
    if (dto.fechaVencimiento !== undefined) payload['fecha_vencimiento'] = dto.fechaVencimiento;
    if (dto.fechaPago        !== undefined) payload['fecha_pago']        = dto.fechaPago;
    if (dto.estado           !== undefined) payload['estado']            = dto.estado;
    if (dto.metodoPago       !== undefined) payload['metodo_pago']       = dto.metodoPago;
    if (dto.periodoMes       !== undefined) payload['periodo_mes']       = dto.periodoMes;
    if (dto.periodoAnio      !== undefined) payload['periodo_anio']      = dto.periodoAnio;
    if (dto.numeroReferencia !== undefined) payload['numero_referencia'] = dto.numeroReferencia;
    if (dto.descripcion      !== undefined) payload['descripcion']       = dto.descripcion;
    if (dto.notas            !== undefined) payload['notas']             = dto.notas;

    const { data, error } = await supabase
      .from('transacciones')
      .update(payload)
      .eq('id', id)
      .select('*, categorias_transaccion(*)')
      .single();

    if (error) {
      throw new Error(`[TransaccionRepo.actualizar] ${error.message}`);
    }

    return mapearFilaTransaccion(data as Record<string, unknown>);
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`[TransaccionRepo.eliminar] ${error.message}`);
    }
  }

  // ── Storage: subida de adjuntos ─────────────────────────────────────────

  /**
   * Sube un archivo de comprobante al bucket "comprobantes" y registra
   * el adjunto en la tabla `adjuntos`.
   *
   * CORRECCIÓN: se elimina la propiedad `contentType` de las opciones de
   * upload porque no existe en FileOptions del SDK @supabase/supabase-js.
   * El SDK infiere el Content-Type desde el objeto File automáticamente.
   *
   * @returns URL pública del archivo subido
   */
  async subirAdjunto(transaccionId: string, archivo: File): Promise<string> {
    const extension  = archivo.name.split('.').pop() ?? 'jpg';
    const rutaStorage = `transacciones/${transaccionId}/${Date.now()}.${extension}`;

    const { error: errorUpload } = await supabase.storage
      .from('comprobantes')
      .upload(rutaStorage, archivo, {
        cacheControl: '3600',
        upsert:       false,
        // contentType eliminado — no existe en FileOptions y causaba error TS
      });

    if (errorUpload) {
      throw new Error(`[TransaccionRepo.subirAdjunto/upload] ${errorUpload.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(rutaStorage);

    const { error: errorDB } = await supabase
      .from('adjuntos')
      .insert({
        transaccion_id:  transaccionId,
        nombre_archivo:  archivo.name,
        ruta_storage:    rutaStorage,
        url_publica:     urlData.publicUrl,
        tipo_mime:       archivo.type,
        tamano_bytes:    archivo.size,
      });

    if (errorDB) {
      throw new Error(`[TransaccionRepo.subirAdjunto/db] ${errorDB.message}`);
    }

    return urlData.publicUrl;
  }
}

// Singleton exportado para inyección de dependencias
export const transaccionRepository = new SupabaseTransaccionRepository();
