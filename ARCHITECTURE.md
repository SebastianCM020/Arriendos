# Documentación de Arquitectura
## Sistema de Gestión de Arriendos

---

## 1. Arquitectura del Sistema (Clean Architecture)

El sistema aplica **Clean Architecture** (Robert C. Martin), organizando el código en capas concéntricas donde la dependencia siempre apunta **hacia adentro** (hacia el Dominio).

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTACIÓN (UI)                             │
│              React Components · Pages · Custom UI                    │
│                                                                       │
│   Dashboard.tsx · PropiedadesPage · InquilinosPage · ContratosPage  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ usa hooks
┌───────────────────────────────▼─────────────────────────────────────┐
│                       APLICACIÓN (Casos de Uso)                      │
│                    Custom Hooks · Use Cases                          │
│                                                                       │
│   useDashboardMetrics · useTransacciones · usePropiedades           │
└──────────┬────────────────────────────────────────┬─────────────────┘
           │ invoca interfaces                       │
           │ (puertos)                               │
┌──────────▼────────────────┐      ┌────────────────▼─────────────────┐
│       DOMINIO              │      │        INFRAESTRUCTURA            │
│   (Núcleo — sin deps.)    │      │    (Adaptadores externos)        │
│                            │      │                                   │
│  · Propiedad.ts            │◄─────│  · supabaseClient.ts             │
│  · Inquilino.ts            │      │  · SupabaseTransaccionRepository  │
│  · Contrato.ts             │      │  · SupabasePropiedadRepository    │
│  · Transaccion.ts          │      │  · Supabase Storage (adjuntos)   │
│  · repositories.ts         │      │                                   │
│    (interfaces/puertos)    │      │  implements ITransaccionRepository│
└────────────────────────────┘      └──────────────────────────────────┘
```

### Principio de Dependencia

```
Presentación ──► Aplicación ──► Dominio ◄── Infraestructura
```

> La Infraestructura implementa las interfaces del Dominio.
> El Dominio nunca conoce a Supabase (es sustituible).

---

## 2. Estructura de Carpetas del Proyecto (`src/`)

```
src/
│
├── domain/                              ← NÚCLEO (sin dependencias externas)
│   │
│   ├── models/                          ← Entidades de negocio (TypeScript puro)
│   │   ├── Propiedad.ts                 ← Entidad + DTOs Propiedad
│   │   ├── Inquilino.ts                 ← Entidad + DTOs Inquilino
│   │   ├── Contrato.ts                  ← Entidad + DTOs Contrato
│   │   └── Transaccion.ts              ← Entidad Transaccion + Adjunto + MetricasDashboard
│   │
│   └── repositories.ts                  ← Interfaces (puertos) de repositorios
│       ├── ITransaccionRepository
│       ├── IPropiedadRepository
│       ├── IInquilinoRepository
│       └── IContratoRepository
│
├── application/                         ← CASOS DE USO
│   │
│   └── hooks/                           ← Custom Hooks (casos de uso en React)
│       ├── useDashboardMetrics.ts        ← Métricas del dashboard
│       ├── usePropiedades.ts             ← (próximo) CRUD propiedades
│       ├── useInquilinos.ts              ← (próximo) CRUD inquilinos
│       └── useTransacciones.ts          ← (próximo) CRUD transacciones
│
├── infrastructure/                      ← ADAPTADORES EXTERNOS
│   │
│   ├── supabaseClient.ts                ← Inicialización del cliente + tipos DB
│   ├── index.ts                         ← Barrel exports de infraestructura
│   │
│   └── repositories/                    ← Implementaciones concretas (adaptadores)
│       ├── SupabaseTransaccionRepository.ts   ← impl. ITransaccionRepository
│       ├── SupabasePropiedadRepository.ts     ← (próximo)
│       ├── SupabaseInquilinoRepository.ts     ← (próximo)
│       └── SupabaseContratoRepository.ts      ← (próximo)
│
└── presentation/                        ← INTERFAZ DE USUARIO
    │
    ├── pages/                           ← Páginas completas
    │   ├── Dashboard.tsx                ← 📊 Panel principal (implementado)
    │   ├── PropiedadesPage.tsx          ← (próximo)
    │   ├── InquilinosPage.tsx           ← (próximo)
    │   ├── ContratosPage.tsx            ← (próximo)
    │   └── TransaccionesPage.tsx        ← (próximo)
    │
    ├── components/                      ← Componentes reutilizables
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Table.tsx
    │   │   └── Skeleton.tsx
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── Layout.tsx
    │   └── dashboard/
    │       ├── MetricCard.tsx
    │       └── PagosTable.tsx
    │
    └── assets/                          ← Imágenes, íconos estáticos
```

---

## 3. Diagrama de Base de Datos (4FN)

### Modelo Entidad-Relación

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   comunas   │◄────────│   propiedades    │         │  inquilinos │
├─────────────┤         ├──────────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)          │         │ id (PK)     │
│ nombre      │         │ nombre           │         │ nombre      │
│ region      │         │ direccion        │         │ apellido    │
└─────────────┘         │ comuna_id (FK)──►│         │ rut (UNIQUE)│
                        │ tipo             │         │ correo      │
                        │ precio_base      │         │ telefono    │
                        │ estado           │         │ estado      │
                        └───────┬──────────┘         └──────┬──────┘
                                │ 1                         │ 1
                                │                           │
                                │ N         N               │
                        ┌───────▼──────────────────────────▼──────┐
                        │               contratos                  │
                        ├──────────────────────────────────────────┤
                        │ id (PK)                                  │
                        │ propiedad_id (FK) ──────────────────────►│
                        │ inquilino_id (FK) ──────────────────────►│
                        │ fecha_inicio / fecha_termino             │
                        │ monto_arriendo                           │
                        │ dia_cobro (1-28)                         │
                        │ monto_garantia / meses_garantia          │
                        │ incluye_agua / incluye_luz               │
                        │ reajuste_ipc                             │
                        │ estado                                   │
                        └───────────────┬──────────────────────────┘
                                        │ 1
                                        │
                                        │ N
                        ┌───────────────▼──────────────────────────┐
                        │             transacciones                │
                        ├──────────────────────────────────────────┤
                        │ id (PK)                                  │
                        │ contrato_id (FK)                         │
                        │ categoria_id (FK) ──────────────────────►│
                        │ tipo (ingreso/egreso)                    │
                        │ monto                                    │
                        │ fecha_emision / fecha_vencimiento        │
                        │ fecha_pago                               │
                        │ estado                                   │
                        │ metodo_pago                              │
                        │ periodo_mes / periodo_anio               │
                        │ numero_referencia                        │
                        └───────────────┬──────────────────────────┘
                                        │ 1
            ┌───────────────────────────┤
            │                           │ N
            │               ┌───────────▼──────────────────────────┐
            │               │              adjuntos                │
            │               ├──────────────────────────────────────┤
            │               │ id (PK)                              │
            │               │ transaccion_id (FK)                  │
            │               │ nombre_archivo                       │
            │               │ ruta_storage  ──────► Supabase Stor. │
            │               │ url_publica                          │
            │               │ tipo_mime                            │
            │               │ tamano_bytes                         │
            │               └──────────────────────────────────────┘
            │
┌───────────▼──────────────────────────┐
│        categorias_transaccion        │
├──────────────────────────────────────┤
│ id (PK)                              │
│ nombre (UNIQUE)                      │
│ tipo (ingreso/egreso)                │
│ descripcion / icono                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│          servicios_basicos           │  ← Separado de transacciones (4FN)
├──────────────────────────────────────┤
│ id (PK)                              │
│ propiedad_id (FK)                    │
│ tipo_servicio (agua/luz/gas)         │
│ periodo_mes / periodo_anio           │
│ lectura_anterior / lectura_actual    │
│ consumo / monto                      │
│ pagado_por                           │
│ transaccion_id (FK, opcional)        │
│ UNIQUE(propiedad_id, tipo, mes, año) │
└──────────────────────────────────────┘
```

---

## 4. Justificación de Normalización 4FN

| Forma Normal | Cumplimiento |
|---|---|
| **1FN** | Todos los atributos son atómicos. Sin grupos repetidos. UUIDs como PKs. |
| **2FN** | Todas las tablas tienen PK simple (UUID). Sin dependencias parciales posibles. |
| **3FN** | Sin dependencias transitivas. `comunas` separada de `propiedades` (región no depende de la propiedad). |
| **4FN** | `servicios_basicos` separado de `transacciones` para evitar dependencias multivaluadas (una propiedad puede tener MÚLTIPLES servicios y MÚLTIPLES transacciones). `adjuntos` separado de `transacciones` (una transacción puede tener múltiples comprobantes). |

---

## 5. Flujo de Datos (Runtime)

```
Usuario navega al Dashboard
        │
        ▼
Dashboard.tsx (Presentación)
        │ usa
        ▼
useDashboardMetrics() (Aplicación)
        │ llama
        ▼
ITransaccionRepository.obtenerMetricas() (Dominio - interfaz)
        │ implementado por
        ▼
SupabaseTransaccionRepository (Infraestructura)
        │ ejecuta queries en
        ▼
Supabase PostgreSQL (Base de Datos)
        │
        ▼
  Datos retornan como entidades de dominio
        │
        ▼
Hook actualiza estado de React
        │
        ▼
Dashboard re-renderiza con datos reales
```

---

## 6. Configuración de Supabase Storage

El bucket `comprobantes` almacena los adjuntos organizados por transacción:

```
comprobantes/
└── transacciones/
    ├── {transaccion-id-1}/
    │   ├── 1722380400000.jpg    ← timestamp Unix como nombre
    │   └── 1722380500000.pdf
    └── {transaccion-id-2}/
        └── 1722380600000.png
```

**Políticas de acceso:**
- `INSERT`: Solo usuarios autenticados
- `SELECT`: Solo usuarios autenticados
- `DELETE`: Solo usuarios autenticados

---

## 7. Variables de Entorno

| Variable | Descripción | Ejemplo (local) |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `http://127.0.0.1:54321` |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública | `eyJhbGciOiJIUzI1NiIs...` |

> **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` en variables de Vite (prefijo `VITE_`).
