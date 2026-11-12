-- =============================================================================
-- SISTEMA DE GESTIÓN DE ARRIENDOS — VizSoft
-- Script de Base de Datos Completo — PostgreSQL (4FN)
-- © 2026 VizSoft. Todos los derechos reservados.
--
-- INSTRUCCIONES DE USO:
--   1. Abrir Supabase Studio → SQL Editor
--   2. Pegar TODO el contenido de este archivo
--   3. Ejecutar (Run)
--   4. Verificar que no haya errores en la consola
--
-- IDEMPOTENTE: seguro de re-ejecutar gracias a IF NOT EXISTS / ON CONFLICT
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- 1. TIPOS ENUMERADOS (ENUM)
--    Garantizan integridad de dominio directamente en la BD.
--    Evitan tablas de catálogo innecesarias para conjuntos cerrados de valores.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE estado_propiedad AS ENUM ('disponible', 'arrendada', 'mantenimiento', 'inactiva');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_inquilino AS ENUM ('activo', 'moroso', 'inactivo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_contrato AS ENUM ('vigente', 'terminado', 'suspendido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_transaccion AS ENUM ('ingreso', 'egreso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_transaccion AS ENUM ('pagado', 'pendiente', 'vencido', 'anulado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metodo_pago AS ENUM ('transferencia', 'efectivo', 'cheque', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_servicio_basico AS ENUM ('agua', 'luz', 'gas', 'internet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_servicio AS ENUM ('pendiente', 'pagado', 'vencido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pagado_por_tipo AS ENUM ('inquilino', 'propietario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- 2. TABLA: comunas
--    Catálogo de comunas/regiones.
--    Separada de propiedades para evitar dependencias transitivas (3FN) y
--    garantizar que no haya dependencias multivaluadas en propiedades (4FN).
-- =============================================================================

CREATE TABLE IF NOT EXISTS comunas (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT        NOT NULL UNIQUE,
  region         TEXT        NOT NULL,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comunas IS 'Catálogo normalizado de comunas y regiones de Chile';


-- =============================================================================
-- 3. TABLA: propiedades
--    Entidad central del sistema.
--    - Sin grupos repetidos (1FN)
--    - Todos los atributos dependen de la PK completa (2FN)
--    - Sin dependencias transitivas (3FN)
--    - Sin dependencias multivaluadas (4FN): comuna_id → tabla comunas
-- =============================================================================

CREATE TABLE IF NOT EXISTS propiedades (
  id                   UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre               TEXT             NOT NULL,
  direccion            TEXT             NOT NULL,
  numero               TEXT,                          -- número de calle
  piso                 TEXT,                          -- piso del edificio
  departamento         TEXT,                          -- identificador de dpto
  comuna_id            UUID             NOT NULL REFERENCES comunas(id) ON DELETE RESTRICT,
  tipo                 TEXT             NOT NULL DEFAULT 'casa'
                         CHECK (tipo IN ('casa', 'departamento', 'local', 'bodega', 'otro')),
  metros_cuadrados     NUMERIC(8,2),
  numero_habitaciones  SMALLINT,
  numero_banos         SMALLINT,
  precio_arriendo_base NUMERIC(12,2)    NOT NULL CHECK (precio_arriendo_base > 0),
  estado               estado_propiedad NOT NULL DEFAULT 'disponible',
  notas                TEXT,
  creado_en            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  actualizado_en       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE propiedades IS 'Inmuebles gestionados por el sistema';
CREATE INDEX IF NOT EXISTS idx_propiedades_comuna ON propiedades(comuna_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado ON propiedades(estado);


-- =============================================================================
-- 4. TABLA: inquilinos
--    Personas que arriendan propiedades.
--    Separada de propiedades porque la relación es M:N (via contratos).
--    Sin contacto de emergencia como grupo repetido → 4FN.
-- =============================================================================

CREATE TABLE IF NOT EXISTS inquilinos (
  id                  UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre              TEXT             NOT NULL,
  apellido            TEXT             NOT NULL,
  rut                 TEXT             NOT NULL UNIQUE,
  correo              TEXT             UNIQUE,
  telefono            TEXT,
  telefono_emergencia TEXT,            -- teléfono del contacto de emergencia
  nombre_emergencia   TEXT,            -- nombre y relación del contacto
  direccion_anterior  TEXT,
  estado              estado_inquilino NOT NULL DEFAULT 'activo',
  notas               TEXT,
  creado_en           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inquilinos IS 'Personas arrendatarias registradas en el sistema';
CREATE INDEX IF NOT EXISTS idx_inquilinos_estado ON inquilinos(estado);
CREATE INDEX IF NOT EXISTS idx_inquilinos_rut    ON inquilinos(rut);


-- =============================================================================
-- 5. TABLA: contratos
--    Tabla de unión M:N entre propiedades e inquilinos.
--    Contiene atributos propios de la relación arriendo → 3FN/4FN.
--    Un contrato puede incluir o no los servicios básicos en el precio.
-- =============================================================================

CREATE TABLE IF NOT EXISTS contratos (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  propiedad_id    UUID            NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  inquilino_id    UUID            NOT NULL REFERENCES inquilinos(id)  ON DELETE RESTRICT,
  fecha_inicio    DATE            NOT NULL,
  fecha_termino   DATE            NOT NULL,
  monto_arriendo  NUMERIC(12,2)   NOT NULL CHECK (monto_arriendo > 0),
  dia_cobro       SMALLINT        NOT NULL CHECK (dia_cobro BETWEEN 1 AND 28),
  meses_garantia  SMALLINT        NOT NULL DEFAULT 1 CHECK (meses_garantia >= 0),
  monto_garantia  NUMERIC(12,2)   NOT NULL CHECK (monto_garantia >= 0),
  incluye_agua    BOOLEAN         NOT NULL DEFAULT FALSE,
  incluye_luz     BOOLEAN         NOT NULL DEFAULT FALSE,
  reajuste_ipc    BOOLEAN         NOT NULL DEFAULT FALSE,
  estado          estado_contrato NOT NULL DEFAULT 'vigente',
  documento_url   TEXT,           -- URL del contrato firmado en Storage
  notas           TEXT,
  creado_en       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT contratos_fecha_check CHECK (fecha_termino > fecha_inicio)
);

COMMENT ON TABLE contratos IS 'Contratos de arriendo que vinculan propiedades e inquilinos';
CREATE INDEX IF NOT EXISTS idx_contratos_propiedad ON contratos(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_contratos_inquilino ON contratos(inquilino_id);
CREATE INDEX IF NOT EXISTS idx_contratos_estado    ON contratos(estado);


-- =============================================================================
-- 6. TABLA: categorias_transaccion
--    Catálogo de tipos de movimiento financiero.
--    Separada de transacciones para evitar redundancia (3FN) y
--    permitir evolucionar el catálogo sin modificar millones de filas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS categorias_transaccion (
  id             UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT             NOT NULL UNIQUE,
  tipo           tipo_transaccion NOT NULL,
  descripcion    TEXT,
  icono          TEXT             DEFAULT 'tag',
  creado_en      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categorias_transaccion IS 'Catálogo de categorías de ingresos y egresos';

-- Datos semilla — categorías estándar del sistema
INSERT INTO categorias_transaccion (nombre, tipo, descripcion, icono) VALUES
  ('Arriendo',         'ingreso', 'Pago mensual de arriendo',               'home'),
  ('Agua',             'egreso',  'Pago de cuenta de agua',                 'droplet'),
  ('Luz',              'egreso',  'Pago de cuenta de electricidad',         'zap'),
  ('Mantenimiento',    'egreso',  'Gastos de mantenimiento y reparaciones', 'wrench'),
  ('Garantía',         'ingreso', 'Depósito de garantía recibido',          'shield'),
  ('Multa por atraso', 'ingreso', 'Recargo por pago tardío',                'alert-triangle'),
  ('Administración',   'egreso',  'Gastos de administración del edificio',  'building'),
  ('Seguro',           'egreso',  'Prima de seguro del inmueble',           'lock'),
  ('Gastos comunes',   'egreso',  'Gastos comunes del edificio',            'layers'),
  ('Otros ingresos',   'ingreso', 'Ingresos no categorizados',              'plus-circle'),
  ('Otros gastos',     'egreso',  'Egresos no categorizados',               'minus-circle')
ON CONFLICT (nombre) DO NOTHING;


-- =============================================================================
-- 7. TABLA: transacciones
--    Registra todos los movimientos financieros (ingresos y gastos).
--    Vinculada a contratos (que ya tiene propiedad + inquilino) → sin
--    redundancia transitiva → 3FN. Cada atributo depende únicamente de id → 4FN.
-- =============================================================================

CREATE TABLE IF NOT EXISTS transacciones (
  id                UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id       UUID               REFERENCES contratos(id)             ON DELETE SET NULL,
  categoria_id      UUID               NOT NULL REFERENCES categorias_transaccion(id) ON DELETE RESTRICT,
  tipo              tipo_transaccion   NOT NULL,
  monto             NUMERIC(12,2)      NOT NULL CHECK (monto > 0),
  fecha_emision     DATE               NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  fecha_pago        DATE,
  estado            estado_transaccion NOT NULL DEFAULT 'pendiente',
  metodo_pago       metodo_pago,
  periodo_mes       SMALLINT           CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio      SMALLINT,
  numero_referencia TEXT,
  descripcion       TEXT,
  notas             TEXT,
  creado_en         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transacciones IS 'Registro de todos los movimientos financieros del sistema';
CREATE INDEX IF NOT EXISTS idx_transacciones_contrato   ON transacciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria  ON transacciones(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_estado     ON transacciones(estado);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha_emit ON transacciones(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_periodo    ON transacciones(periodo_anio, periodo_mes);


-- =============================================================================
-- 8. TABLA: adjuntos
--    Comprobantes de pago almacenados en Supabase Storage.
--    Separada de transacciones para cumplir 4FN: una transacción puede tener
--    múltiples adjuntos (relación multivaluada que requiere tabla propia).
-- =============================================================================

CREATE TABLE IF NOT EXISTS adjuntos (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaccion_id UUID        NOT NULL REFERENCES transacciones(id) ON DELETE CASCADE,
  nombre_archivo TEXT        NOT NULL,
  ruta_storage   TEXT        NOT NULL UNIQUE, -- path único en el bucket de Storage
  url_publica    TEXT,
  tipo_mime      TEXT        NOT NULL DEFAULT 'image/jpeg',
  tamano_bytes   BIGINT,
  descripcion    TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE adjuntos IS 'Archivos adjuntos (comprobantes) de cada transacción';
CREATE INDEX IF NOT EXISTS idx_adjuntos_transaccion ON adjuntos(transaccion_id);


-- =============================================================================
-- 9. TABLA: servicios_basicos
--    Planillas de servicios básicos (agua y electricidad).
--
--    DISEÑO 4FN:
--    - Separada de transacciones porque las lecturas de medidor son datos
--      propios del servicio, no del movimiento financiero.
--    - Separada de contratos porque los servicios pueden corresponder a
--      la propiedad completa (agua general del edificio) independientemente
--      de qué inquilino habita cada piso.
--    - La columna 'referencia' resuelve la dependencia multivaluada:
--        agua  → 1 planilla:  'General Edificio'
--        luz   → 3 planillas: 'Piso 1' | 'Piso 2' | 'Piso 3'
--      Sin esta columna, la restricción UNIQUE impedía múltiples planillas
--      del mismo tipo/mes/año → violación de la realidad del negocio.
--
--    UNICIDAD: (propiedad_id, tipo_servicio, referencia, periodo_mes, periodo_anio)
--    garantiza que no se duplique la misma planilla del mismo piso y mes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS servicios_basicos (
  id               UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  propiedad_id     UUID                 NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  tipo_servicio    tipo_servicio_basico  NOT NULL,
  referencia       TEXT                 NOT NULL DEFAULT 'General Edificio',
                                        -- agua: 'General Edificio'
                                        -- luz:  'Piso 1' | 'Piso 2' | 'Piso 3'
  periodo_mes      SMALLINT             NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio     SMALLINT             NOT NULL,
  lectura_anterior NUMERIC(10,3),       -- lectura anterior del medidor
  lectura_actual   NUMERIC(10,3),       -- lectura actual del medidor
  consumo          NUMERIC(10,3)
                   GENERATED ALWAYS AS  -- calculado automáticamente por la BD
                   (CASE
                     WHEN lectura_actual IS NOT NULL AND lectura_anterior IS NOT NULL
                     THEN lectura_actual - lectura_anterior
                     ELSE NULL
                    END) STORED,
  monto            NUMERIC(12,2)        NOT NULL CHECK (monto > 0),
  estado           estado_servicio      NOT NULL DEFAULT 'pendiente',
  fecha_vencimiento DATE,
  fecha_pago       DATE,
  numero_boleta    TEXT,                -- N° de boleta o factura del servicio
  pagado_por       pagado_por_tipo      NOT NULL DEFAULT 'propietario',
  transaccion_id   UUID                 REFERENCES transacciones(id) ON DELETE SET NULL,
  notas            TEXT,
  creado_en        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  -- Unicidad: una sola planilla por servicio + referencia (piso) + período
  CONSTRAINT servicios_basicos_unique_planilla
    UNIQUE (propiedad_id, tipo_servicio, referencia, periodo_mes, periodo_anio),

  -- Coherencia de fechas: no puede estar pagado sin fecha de pago
  CONSTRAINT servicios_basicos_pago_check
    CHECK (estado != 'pagado' OR fecha_pago IS NOT NULL)
);

COMMENT ON TABLE servicios_basicos IS
  'Planillas de servicios básicos por propiedad. '
  'Agua: 1 planilla general del edificio. '
  'Luz: 1 planilla por piso (Piso 1, Piso 2, Piso 3).';

CREATE INDEX IF NOT EXISTS idx_servicios_propiedad ON servicios_basicos(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_servicios_tipo      ON servicios_basicos(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_servicios_estado    ON servicios_basicos(estado);
CREATE INDEX IF NOT EXISTS idx_servicios_periodo   ON servicios_basicos(periodo_anio, periodo_mes);


-- =============================================================================
-- 10. FUNCIÓN Y TRIGGER: actualizar_timestamp
--     Mantiene el campo actualizado_en sincronizado automáticamente.
--     Un único trigger reutilizable para todas las tablas → DRY.
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con actualizado_en
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'comunas', 'propiedades', 'inquilinos', 'contratos',
    'categorias_transaccion', 'transacciones', 'adjuntos', 'servicios_basicos'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_actualizar_%I ON %I;
       CREATE TRIGGER trg_actualizar_%I
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp()',
      t, t, t, t
    );
  END LOOP;
END;
$$;


-- =============================================================================
-- 11. FUNCIÓN TRIGGER: validar_lecturas_servicio
--     Garantiza que lectura_actual >= lectura_anterior (no puede bajar el medidor).
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_validar_lecturas_servicio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lectura_anterior IS NOT NULL
     AND NEW.lectura_actual IS NOT NULL
     AND NEW.lectura_actual < NEW.lectura_anterior THEN
    RAISE EXCEPTION
      'La lectura actual (%) no puede ser menor a la lectura anterior (%)',
      NEW.lectura_actual, NEW.lectura_anterior;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_lecturas ON servicios_basicos;
CREATE TRIGGER trg_validar_lecturas
  BEFORE INSERT OR UPDATE ON servicios_basicos
  FOR EACH ROW EXECUTE FUNCTION fn_validar_lecturas_servicio();


-- =============================================================================
-- 12. VISTA: vista_dashboard
--     Consolida la información más usada por el dashboard:
--     propiedad + inquilino + contrato + transacciones del período.
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
JOIN propiedades p              ON p.id  = c.propiedad_id
JOIN inquilinos i               ON i.id  = c.inquilino_id
LEFT JOIN transacciones t       ON t.contrato_id = c.id
LEFT JOIN categorias_transaccion cat ON cat.id   = t.categoria_id
WHERE c.estado = 'vigente';

COMMENT ON VIEW vista_dashboard IS
  'Vista consolidada para el dashboard: contratos vigentes con sus transacciones';


-- =============================================================================
-- 13. VISTA: vista_servicios_pendientes
--     Resumen de planillas de servicios sin pagar, útil para alertas.
-- =============================================================================

CREATE OR REPLACE VIEW vista_servicios_pendientes AS
SELECT
  sb.id,
  p.nombre          AS propiedad_nombre,
  sb.tipo_servicio,
  sb.referencia,
  sb.periodo_mes,
  sb.periodo_anio,
  sb.monto,
  sb.estado,
  sb.fecha_vencimiento,
  sb.numero_boleta,
  CASE
    WHEN sb.fecha_vencimiento < CURRENT_DATE AND sb.estado = 'pendiente'
    THEN true ELSE false
  END AS esta_vencida
FROM servicios_basicos sb
JOIN propiedades p ON p.id = sb.propiedad_id
WHERE sb.estado IN ('pendiente', 'vencido')
ORDER BY sb.fecha_vencimiento ASC NULLS LAST;

COMMENT ON VIEW vista_servicios_pendientes IS
  'Planillas de servicios básicos pendientes de pago, ordenadas por vencimiento';


-- =============================================================================
-- 14. ROW LEVEL SECURITY (RLS)
--     Política actual: acceso total para usuarios autenticados.
--     Para producción multi-tenant: agregar filtro por owner_id en cada tabla.
-- =============================================================================

ALTER TABLE comunas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquilinos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_transaccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuntos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_basicos      ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas para poder re-ejecutar el script de forma segura
DROP POLICY IF EXISTS "Acceso autenticado - comunas"               ON comunas;
DROP POLICY IF EXISTS "Acceso autenticado - propiedades"           ON propiedades;
DROP POLICY IF EXISTS "Acceso autenticado - inquilinos"            ON inquilinos;
DROP POLICY IF EXISTS "Acceso autenticado - contratos"             ON contratos;
DROP POLICY IF EXISTS "Acceso autenticado - categorias"            ON categorias_transaccion;
DROP POLICY IF EXISTS "Lectura pública - categorias"               ON categorias_transaccion;
DROP POLICY IF EXISTS "Acceso autenticado - transacciones"         ON transacciones;
DROP POLICY IF EXISTS "Acceso autenticado - adjuntos"              ON adjuntos;
DROP POLICY IF EXISTS "Acceso autenticado - servicios_basicos"     ON servicios_basicos;

-- Crear políticas limpias
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

-- Las categorías son de solo lectura para usuarios anónimos (catálogo público)
CREATE POLICY "Lectura pública - categorias"
  ON categorias_transaccion FOR SELECT TO anon USING (true);

CREATE POLICY "Acceso autenticado - transacciones"
  ON transacciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - adjuntos"
  ON adjuntos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acceso autenticado - servicios_basicos"
  ON servicios_basicos FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- =============================================================================
-- 15. STORAGE: bucket "comprobantes"
--     Almacena fotos/PDFs de comprobantes de pago (transferencias, efectivo).
--     Límite: 10 MB por archivo. Tipos permitidos: imágenes y PDF.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprobantes',
  'comprobantes',
  false,
  10485760,   -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (seguras por bucket_id)
DROP POLICY IF EXISTS "Upload autenticado - comprobantes"  ON storage.objects;
DROP POLICY IF EXISTS "Lectura autenticada - comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Eliminar autenticado - comprobantes" ON storage.objects;

CREATE POLICY "Upload autenticado - comprobantes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Lectura autenticada - comprobantes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'comprobantes');

CREATE POLICY "Eliminar autenticado - comprobantes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'comprobantes');


-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
-- Tablas creadas:
--   comunas · propiedades · inquilinos · contratos
--   categorias_transaccion · transacciones · adjuntos · servicios_basicos
--
-- Vistas creadas:
--   vista_dashboard · vista_servicios_pendientes
--
-- Triggers creados:
--   trg_actualizar_* (en todas las tablas)
--   trg_validar_lecturas (en servicios_basicos)
--
-- © 2026 VizSoft. Todos los derechos reservados.
-- =============================================================================
