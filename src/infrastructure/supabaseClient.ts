// =============================================================================
// INFRAESTRUCTURA: Cliente de Supabase
// Inicializa y exporta el cliente singleton leyendo variables de Vite
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// Validación de variables de entorno en tiempo de inicio
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
  throw new Error(
    '[supabaseClient] VITE_SUPABASE_URL no está definida. ' +
    'Asegúrate de tenerla en tu archivo .env.local'
  );
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
  throw new Error(
    '[supabaseClient] VITE_SUPABASE_ANON_KEY no está definida. ' +
    'Asegúrate de tenerla en tu archivo .env.local'
  );
}

// =============================================================================
// Tipado de la base de datos (se puede generar con: supabase gen types typescript)
// =============================================================================
export type Database = {
  public: {
    Tables: {
      propiedades:            { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      inquilinos:             { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      contratos:              { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      transacciones:          { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      categorias_transaccion: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      adjuntos:               { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      servicios_basicos:      { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      comunas:                { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: {
      vista_dashboard: { Row: Record<string, unknown> };
    };
    Functions: Record<string, unknown>;
    Enums: {
      estado_propiedad:    'disponible' | 'arrendada' | 'mantenimiento' | 'inactiva';
      estado_inquilino:    'activo' | 'moroso' | 'inactivo';
      estado_contrato:     'vigente' | 'terminado' | 'suspendido';
      tipo_transaccion:    'ingreso' | 'egreso';
      estado_transaccion:  'pagado' | 'pendiente' | 'vencido' | 'anulado';
      metodo_pago:         'transferencia' | 'efectivo' | 'cheque' | 'otro';
    };
  };
};

// =============================================================================
// Cliente Supabase singleton con tipado
// =============================================================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-app-version': '1.0.0',
    },
  },
});

export default supabase;
