-- =============================================================================
-- SISTEMA DE GESTIÓN DE ARRIENDOS
-- Script de Base de Datos - PostgreSQL (4FN)
-- Ejecutar en Supabase SQL Editor
-- =============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TIPOS ENUMERADOS
-- =============================================================================

CREATE TYPE estado_propiedad AS ENUM ('disponible', 'arrendada', 'mantenimiento', 'inactiva');
CREATE TYPE estado_inquilino AS ENUM ('activo', 'moroso', 'inactivo');
CREATE TYPE estado_contrato  AS ENUM ('vigente', 'terminado', 'suspendido');
CREATE TYPE tipo_transaccion AS ENUM ('ingreso', 'egreso');
CREATE TYPE estado_transaccion AS ENUM ('pagado', 'pendiente', 'vencido', 'anulado');
CREATE TYPE metodo_pago AS ENUM ('transferencia', 'efectivo', 'cheque', 'otro');

-- =============================================================================
-- TABLA: comunas
-- Separada para cumplir 4FN (evita dependencias multivaluadas en propiedades)
-- =============================================================================

CREATE TABLE IF NOT EXISTS comunas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL UNIQUE,
  region       TEXT NOT NULL,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLA: propiedades
-- Entidad principal. 1NF→4FN garantizado: sin grupos repetidos ni deps. multiv.
-- =============================================================================

CREATE TABLE IF NOT EXISTS propiedades (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  direccion       TEXT NOT NULL,
  numero          TEXT,
  piso            TEXT,
  departamento    TEXT,
  comuna_id       UUID NOT NULL REFERENCES comunas(id) ON DELETE RESTRICT,
  tipo            TEXT NOT NULL DEFAULT 'departamento',  -- casa, departamento, local, bodega
  metros_cuadrados NUMERIC(8,2),
  numero_habitaciones SMALLINT,
  numero_banos    SMALLINT,
  precio_arriendo_base NUMERIC(12,2) NOT NULL,
  estado          estado_propiedad NOT NULL DEFAULT 'disponible',
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLA: inquilinos
-- Separada de propiedades (relación M:N via contratos) → cumple 4FN
-- =============================================================================

CREATE TABLE IF NOT EXISTS inquilinos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  rut             TEXT NOT NULL UNIQUE,
  correo          TEXT UNIQUE,
  telefono        TEXT,
  telefono_emergencia TEXT,
  nombre_emergencia   TEXT,
  direccion_anterior TEXT,
  estado          estado_inquilino NOT NULL DEFAULT 'activo',
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLA: contratos (leases)
-- Resuelve relación M:N entre propiedades e inquilinos
-- Contiene atributos propios de la relación → 4FN garantizado
-- =============================================================================

CREATE TABLE IF NOT EXISTS contratos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  propiedad_id        UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  inquilino_id        UUID NOT NULL REFERENCES inquilinos(id) ON DELETE RESTRICT,
  fecha_inicio        DATE NOT NULL,
  fecha_termino       DATE NOT NULL,
  monto_arriendo      NUMERIC(12,2) NOT NULL,
  dia_cobro           SMALLINT NOT NULL CHECK (dia_cobro BETWEEN 1 AND 28),
  meses_garantia      SMALLINT NOT NULL DEFAULT 1,
  monto_garantia      NUMERIC(12,2) NOT NULL,
  incluye_agua        BOOLEAN NOT NULL DEFAULT FALSE,
  incluye_luz         BOOLEAN NOT NULL DEFAULT FALSE,
  reajuste_ipc        BOOLEAN NOT NULL DEFAULT FALSE,
  estado              estado_contrato NOT NULL DEFAULT 'vigente',
  documento_url       TEXT,
  notas               TEXT,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contratos_fecha_check CHECK (fecha_termino > fecha_inicio)
);

-- Índices para consultas frecuentes
CREATE INDEX idx_contratos_propiedad ON contratos(propiedad_id);
CREATE INDEX idx_contratos_inquilino ON contratos(inquilino_id);
CREATE INDEX idx_contratos_estado    ON contratos(estado);

-- =============================================================================
-- TABLA: categorias_transaccion
-- Catálogo normalizado para evitar datos repetidos en transacciones → 2FN/3FN
-- =============================================================================

CREATE TABLE IF NOT EXISTS categorias_transaccion (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL UNIQUE,
  tipo         tipo_transaccion NOT NULL,
  descripcion  TEXT,
  icono        TEXT DEFAULT 'tag',
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos semilla obligatorios
INSERT INTO categorias_transaccion (nombre, tipo, descripcion, icono) VALUES
  ('Arriendo',           'ingreso', 'Pago mensual de arriendo',          'home'),
  ('Agua',               'egreso',  'Pago de cuenta de agua',            'droplet'),
  ('Luz',                'egreso',  'Pago de cuenta de electricidad',    'zap'),
  ('Mantenimiento',      'egreso',  'Gastos de mantenimiento y reparaciones', 'wrench'),
  ('Garantía',           'ingreso', 'Depósito de garantía recibido',     'shield'),
  ('Multa por atraso',   'ingreso', 'Recargo por pago tardío',           'alert-triangle'),
  ('Administración',     'egreso',  'Gastos de administración del edificio', 'building'),
  ('Seguro',             'egreso',  'Prima de seguro del inmueble',      'lock'),
  ('Gastos comunes',     'egreso',  'Gastos comunes del edificio',       'layers'),
  ('Otros ingresos',     'ingreso', 'Ingresos no categorizados',         'plus-circle'),
  ('Otros gastos',       'egreso',  'Egresos no categorizados',          'minus-circle');

-- =============================================================================
-- TABLA: transacciones
-- Registra TODOS los movimientos financieros (ingresos y gastos)
-- Ligada a contrato (y por ende a propiedad + inquilino) → 3FN/4FN
-- =============================================================================

CREATE TABLE IF NOT EXISTS transacciones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id       UUID REFERENCES contratos(id) ON DELETE SET NULL,
  categoria_id      UUID NOT NULL REFERENCES categorias_transaccion(id) ON DELETE RESTRICT,
  tipo              tipo_transaccion NOT NULL,
  monto             NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  fecha_emision     DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  fecha_pago        DATE,
  estado            estado_transaccion NOT NULL DEFAULT 'pendiente',
  metodo_pago       metodo_pago,
  periodo_mes       SMALLINT CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio      SMALLINT,
  numero_referencia TEXT,
  descripcion       TEXT,
  notas             TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas del dashboard
CREATE INDEX idx_transacciones_contrato   ON transacciones(contrato_id);
CREATE INDEX idx_transacciones_categoria  ON transacciones(categoria_id);
CREATE INDEX idx_transacciones_estado     ON transacciones(estado);
CREATE INDEX idx_transacciones_fecha_emit ON transacciones(fecha_emision DESC);
CREATE INDEX idx_transacciones_periodo    ON transacciones(periodo_anio, periodo_mes);

-- =============================================================================
-- TABLA: adjuntos (attachments)
-- Comprobantes de pago almacenados en Supabase Storage
-- Separada de transacciones → evita dependencias multivaluadas → 4FN
-- =============================================================================

CREATE TABLE IF NOT EXISTS adjuntos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaccion_id  UUID NOT NULL REFERENCES transacciones(id) ON DELETE CASCADE,
  nombre_archivo  TEXT NOT NULL,
  ruta_storage    TEXT NOT NULL,  -- path en Supabase Storage bucket
  url_publica     TEXT,
  tipo_mime       TEXT NOT NULL DEFAULT 'image/jpeg',
  tamano_bytes    BIGINT,
  descripcion     TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adjuntos_transaccion ON adjuntos(transaccion_id);

-- =============================================================================
-- TABLA: servicios_basicos
-- Lecturas de medidor para agua y luz (depende de propiedad, no del contrato)
-- Separada para cumplir 4FN (evita mezclar lecturas con pagos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS servicios_basicos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  propiedad_id      UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  tipo_servicio     TEXT NOT NULL CHECK (tipo_servicio IN ('agua', 'luz', 'gas', 'internet')),
  periodo_mes       SMALLINT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio      SMALLINT NOT NULL,
  lectura_anterior  NUMERIC(10,3),
  lectura_actual    NUMERIC(10,3),
  consumo           NUMERIC(10,3),
  monto             NUMERIC(12,2) NOT NULL,
  pagado_por        TEXT NOT NULL DEFAULT 'inquilino' CHECK (pagado_por IN ('inquilino', 'propietario')),
  transaccion_id    UUID REFERENCES transacciones(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(propiedad_id, tipo_servicio, periodo_mes, periodo_anio)
);

-- =============================================================================
-- FUNCIÓN TRIGGER: actualizar_timestamp
-- Actualiza automáticamente el campo actualizado_en en todas las tablas
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'comunas','propiedades','inquilinos','contratos',
    'categorias_transaccion','transacciones','adjuntos','servicios_basicos'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_actualizar_%I
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- VISTA: vista_dashboard
-- Agrega datos para el dashboard (usado por el custom hook)
-- =============================================================================

CREATE OR REPLACE VIEW vista_dashboard AS
SELECT
  p.id              AS propiedad_id,
  p.nombre          AS propiedad_nombre,
  p.estado          AS propiedad_estado,
  i.id              AS inquilino_id,
  i.nombre || ' ' || i.apellido AS inquilino_nombre,
  i.estado          AS inquilino_estado,
  c.id              AS contrato_id,
  c.monto_arriendo,
  c.dia_cobro,
  c.fecha_termino,
  t.id              AS transaccion_id,
  t.tipo            AS transaccion_tipo,
  t.monto           AS transaccion_monto,
  t.estado          AS transaccion_estado,
  t.fecha_vencimiento,
  t.fecha_pago,
  t.periodo_mes,
  t.periodo_anio,
  cat.nombre        AS categoria_nombre
FROM contratos c
JOIN propiedades p  ON p.id = c.propiedad_id
JOIN inquilinos i   ON i.id = c.inquilino_id
LEFT JOIN transacciones t ON t.contrato_id = c.id
LEFT JOIN categorias_transaccion cat ON cat.id = t.categoria_id
WHERE c.estado = 'vigente';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Política básica: solo usuarios autenticados acceden a sus propios datos
-- En producción, agregar filtro por propietario (owner_id)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE comunas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquilinos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_transaccion   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuntos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_basicos        ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso completo para usuarios autenticados (ajustar en producción)
CREATE POLICY "Acceso autenticado - comunas"
  ON comunas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - propiedades"
  ON propiedades FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - inquilinos"
  ON inquilinos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - contratos"
  ON contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - categorias"
  ON categorias_transaccion FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - transacciones"
  ON transacciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - adjuntos"
  ON adjuntos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - servicios_basicos"
  ON servicios_basicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Política de lectura pública para categorías (catálogo)
CREATE POLICY "Lectura pública - categorias"
  ON categorias_transaccion FOR SELECT TO anon USING (true);

-- =============================================================================
-- STORAGE: bucket para comprobantes de pago
-- Ejecutar desde Supabase Dashboard o con el CLI
-- =============================================================================

-- Nota: Crear bucket 'comprobantes' desde el Dashboard de Supabase Storage
-- o via CLI: supabase storage create comprobantes

-- Política de storage para usuarios autenticados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprobantes',
  'comprobantes',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Upload autenticado - comprobantes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Lectura autenticada - comprobantes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'comprobantes');

CREATE POLICY "Eliminar autenticado - comprobantes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'comprobantes');
