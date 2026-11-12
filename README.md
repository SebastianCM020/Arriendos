# 🏠 Sistema de Gestión de Arriendos

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Local-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

Sistema web de gestión de arriendos inmobiliarios construido con **Clean Architecture**, **React + Vite + TypeScript** y **Supabase** como backend. Permite gestionar propiedades, inquilinos, contratos, pagos y comprobantes de pago.

---

## ✨ Características

- 📊 **Dashboard** con métricas en tiempo real (ingresos, facturas pendientes, morosos)
- 🏠 **Gestión de Propiedades** — tipos, estados, precios y ubicaciones
- 👥 **Gestión de Inquilinos** — datos personales, estado de morosidad
- 📄 **Contratos** — vigencia, montos, días de cobro, garantías
- 💰 **Transacciones** — ingresos y gastos categorizados (arriendo, agua, luz, mantenimiento)
- 📎 **Adjuntos/Comprobantes** — subida de imágenes y PDFs a Supabase Storage
- 🔐 **Row Level Security (RLS)** — políticas de seguridad en todas las tablas
- 🗄️ **Base de datos 4FN** — completamente normalizada hasta la Cuarta Forma Normal

---

## 🏗️ Arquitectura

El proyecto aplica **Clean Architecture** con separación estricta en 4 capas:

```
Presentación → Aplicación → Dominio ← Infraestructura
```

- **Dominio**: Entidades TypeScript puras, interfaces de repositorios (puertos)
- **Aplicación**: Custom Hooks (casos de uso)
- **Infraestructura**: Cliente Supabase, implementaciones de repositorios (adaptadores)
- **Presentación**: Componentes React, páginas, UI

> Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para diagramas detallados.

---

## ▶️ Levantar el proyecto

### Prerrequisitos

- Node.js 20+
- Docker Desktop (para Supabase local)
- Supabase CLI

### 1. Instalar dependencias (solo la primera vez)

```bash
npm install
```

### 2. Iniciar Supabase local

```bash
# Asegúrate de que Docker Desktop esté corriendo, luego:
npx supabase start

# Para ver las URLs y credenciales generadas:
npx supabase status
```

Esto levanta:
- **Studio (UI):** http://localhost:54323
- **API:** http://localhost:54321

### 3. Configurar variables de entorno

El archivo `.env.local` ya debe contener:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<tu-anon-key-local>
```

> Las credenciales locales se obtienen con `npx supabase status`.

### 4. Ejecutar la migración de base de datos (solo la primera vez)

```bash
# Opción A: manual en Supabase Studio (recomendado)
# Abrir http://localhost:54323 → SQL Editor
# Pegar el contenido de supabase/migrations/001_schema_inicial.sql
# Ejecutar → Run

# Opción B: via CLI
npx supabase db push
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## ⏹️ Apagar el proyecto

### 1. Detener el servidor de desarrollo

En la terminal donde está corriendo `npm run dev`, presiona:

```
Ctrl + C
```

### 2. Detener Supabase local

```bash
npx supabase stop
```

> Esto detiene los contenedores Docker de Supabase pero **conserva los datos**.
> Si quieres eliminar también los datos locales: `npx supabase stop --no-backup`

---

## 📁 Estructura del Proyecto

```
src/
├── domain/                          # Capa de Dominio (núcleo)
│   ├── models/
│   │   └── Transaccion.ts           # Entidades, DTOs y tipos del dominio
│   └── repositories.ts              # Interfaces (puertos) de repositorios
│
├── application/                     # Capa de Aplicación (casos de uso)
│   └── hooks/
│       └── useDashboardMetrics.ts   # Hook: métricas del dashboard
│
├── infrastructure/                  # Capa de Infraestructura (adaptadores)
│   ├── supabaseClient.ts            # Inicialización del cliente Supabase
│   ├── index.ts                     # Barrel exports
│   └── repositories/
│       └── SupabaseTransaccionRepository.ts  # Implementación concreta
│
└── presentation/                    # Capa de Presentación (UI)
    ├── layout/
    │   └── AppLayout.tsx            # Sidebar + navegación compartida
    └── pages/
        ├── Dashboard.tsx            # Panel de control con métricas
        ├── PropiedadesPage.tsx      # Gestión de Casa Pisulli
        ├── InquilinosPage.tsx       # Gestión de inquilinos
        ├── ContratosPage.tsx        # Gestión de contratos
        ├── PagosPage.tsx            # Registro de pagos
        └── ServiciosPage.tsx        # Servicios básicos (Agua y Luz)

supabase/
└── migrations/
    └── 001_schema_inicial.sql       # Schema completo de producción (4FN)
```

---

## 🗃️ Base de Datos

### Tablas

| Tabla                    | Descripción                                  |
|--------------------------|----------------------------------------------|
| `comunas`                | Catálogo de comunas/ciudades (4FN)            |
| `propiedades`            | Inmuebles gestionados                         |
| `inquilinos`             | Arrendatarios                                 |
| `contratos`              | Relación propiedad↔inquilino con términos    |
| `categorias_transaccion` | Catálogo de tipos de ingreso/gasto           |
| `transacciones`          | Todos los movimientos financieros             |
| `adjuntos`               | Comprobantes de pago (Supabase Storage)      |
| `servicios_basicos`      | Lecturas de medidor agua/luz por propiedad   |

### Generar tipos TypeScript desde Supabase

```bash
supabase gen types typescript --local > src/infrastructure/database.types.ts
```

---

## 🔐 Seguridad (RLS)

Todas las tablas tienen **Row Level Security** habilitado. Las políticas actuales permiten acceso completo a usuarios autenticados.

Para producción, añadir una columna `propietario_id UUID REFERENCES auth.users(id)` y filtrar por `auth.uid()`:

```sql
-- Ejemplo de política por propietario
CREATE POLICY "Solo mis propiedades"
  ON propiedades FOR ALL TO authenticated
  USING (propietario_id = auth.uid());
```

---

## 📦 Dependencias Principales

| Paquete                  | Versión | Propósito                        |
|--------------------------|---------|----------------------------------|
| `react`                  | 19      | UI framework                     |
| `react-dom`              | 19      | Renderizado DOM                  |
| `@supabase/supabase-js`  | latest  | Cliente Supabase (DB + Storage)  |
| `react-router-dom`       | latest  | Routing SPA                      |
| `lucide-react`           | latest  | Iconos SVG                       |
| `tailwindcss`            | 3.4     | Utilidades CSS                   |
| `typescript`             | 6.0     | Tipado estático                  |
| `vite`                   | 8       | Build tool / dev server          |

---

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo con HMR
npm run build        # Build de producción (tsc + vite build)
npm run preview      # Preview del build de producción
npm run lint         # ESLint
```

---

## 🔄 Pasar de Mock a Datos Reales

El hook `useDashboardMetrics` usa datos mock en este momento. Para conectar Supabase real:

1. Asegúrate de que la migración esté aplicada
2. En `src/application/hooks/useDashboardMetrics.ts`, reemplaza la sección comentada:

```typescript
// Reemplazar esto:
const [metricas, ultimosPagos] = await Promise.all([
  simularCarga(generarMetricasMock(), 800),
  simularCarga(generarUltimosPagosMock(), 1000),
]);

// Por esto:
import { transaccionRepository } from '../../infrastructure';

const [metricas, ultimosPagos] = await Promise.all([
  transaccionRepository.obtenerMetricas(mes, anio),
  transaccionRepository.obtenerResumenDashboard(mes, anio),
]);
```

---

## 📋 Roadmap

- [ ] Autenticación con Supabase Auth
- [ ] CRUD completo de Propiedades
- [ ] CRUD completo de Inquilinos
- [ ] CRUD completo de Contratos
- [ ] Subida de comprobantes de pago
- [ ] Generación de recibos en PDF
- [ ] Notificaciones por correo (Supabase Edge Functions)
- [ ] Reajuste automático por IPC
- [ ] Reportes exportables (Excel/PDF)
- [ ] Aplicación móvil (React Native / Expo)

---

## 👤 Autor

Desarrollado por **VizSoft**

---

## 📄 Licencia

© 2026 VizSoft. Todos los derechos reservados.

Este software es propiedad exclusiva de VizSoft. Queda prohibida su reproducción, distribución o uso sin autorización expresa y por escrito del titular.
