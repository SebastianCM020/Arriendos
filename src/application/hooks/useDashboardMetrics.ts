// =============================================================================
// APLICACIÓN: Custom Hook useDashboardMetrics
// Caso de uso: obtener métricas y últimos pagos para el Dashboard
// Por ahora usa datos mock simulando carga asíncrona
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { MetricasDashboard, TransaccionResumen } from '../../domain/models/Transaccion';

interface DashboardState {
  metricas: MetricasDashboard | null;
  ultimosPagos: TransaccionResumen[];
  cargando: boolean;
  error: string | null;
  mesActual: number;
  anioActual: number;
}

// Datos mock que simulan la respuesta real de Supabase
const generarMetricasMock = (): MetricasDashboard => ({
  ingresosDelMes:        3_450_000,
  facturasPendientes:    4,
  facturasVencidas:      2,
  inquilinosMorosos:     1,
  propiedadesOcupadas:   5,
  propiedadesDisponibles: 2,
});

const generarUltimosPagosMock = (): TransaccionResumen[] => [
  {
    id:               '1',
    inquilinoNombre:  'Carlos Mendoza',
    propiedadNombre:  'Depto. 302 - Las Condes',
    categorianombre:  'Arriendo',
    tipo:             'ingreso',
    monto:            720_000,
    estado:           'pagado',
    fechaVencimiento: '2026-07-05',
    fechaPago:        '2026-07-04',
  },
  {
    id:               '2',
    inquilinoNombre:  'María Torres',
    propiedadNombre:  'Casa 45 - Providencia',
    categorianombre:  'Arriendo',
    tipo:             'ingreso',
    monto:            950_000,
    estado:           'pendiente',
    fechaVencimiento: '2026-07-10',
    fechaPago:        undefined,
  },
  {
    id:               '3',
    inquilinoNombre:  'Pedro Sánchez',
    propiedadNombre:  'Local B - Ñuñoa',
    categorianombre:  'Arriendo',
    tipo:             'ingreso',
    monto:            580_000,
    estado:           'vencido',
    fechaVencimiento: '2026-07-01',
    fechaPago:        undefined,
  },
  {
    id:               '4',
    inquilinoNombre:  'Ana Rodríguez',
    propiedadNombre:  'Depto. 101 - Vitacura',
    categorianombre:  'Agua',
    tipo:             'egreso',
    monto:            45_200,
    estado:           'pagado',
    fechaVencimiento: '2026-07-15',
    fechaPago:        '2026-07-12',
  },
  {
    id:               '5',
    inquilinoNombre:  'Juan Castro',
    propiedadNombre:  'Depto. 205 - Miraflores',
    categorianombre:  'Arriendo',
    tipo:             'ingreso',
    monto:            680_000,
    estado:           'pagado',
    fechaVencimiento: '2026-07-05',
    fechaPago:        '2026-07-05',
  },
  {
    id:               '6',
    inquilinoNombre:  'Global',
    propiedadNombre:  'Depto. 302 - Las Condes',
    categorianombre:  'Mantenimiento',
    tipo:             'egreso',
    monto:            125_000,
    estado:           'pagado',
    fechaVencimiento: '2026-07-20',
    fechaPago:        '2026-07-18',
  },
];

// Simula un delay de red
function simularCarga<T>(datos: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(datos), ms));
}

export function useDashboardMetrics() {
  const ahora = new Date();

  const [state, setState] = useState<DashboardState>({
    metricas:     null,
    ultimosPagos: [],
    cargando:     true,
    error:        null,
    mesActual:    ahora.getMonth() + 1,
    anioActual:   ahora.getFullYear(),
  });

  const cargarDatos = useCallback(async (mes: number, anio: number) => {
    setState((prev) => ({ ...prev, cargando: true, error: null }));

    try {
      // En producción reemplazar por:
      // const [metricas, ultimosPagos] = await Promise.all([
      //   transaccionRepository.obtenerMetricas(mes, anio),
      //   transaccionRepository.obtenerResumenDashboard(mes, anio),
      // ]);

      const [metricas, ultimosPagos] = await Promise.all([
        simularCarga(generarMetricasMock(), 800),
        simularCarga(generarUltimosPagosMock(), 1000),
      ]);

      setState((prev) => ({
        ...prev,
        metricas,
        ultimosPagos,
        cargando: false,
      }));
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al cargar métricas';
      setState((prev) => ({ ...prev, cargando: false, error: mensaje }));
    }
  }, []);

  // Cargar datos al montar y cuando cambia mes/año
  useEffect(() => {
    void cargarDatos(state.mesActual, state.anioActual);
  }, [cargarDatos, state.mesActual, state.anioActual]);

  const cambiarPeriodo = useCallback((mes: number, anio: number) => {
    setState((prev) => ({ ...prev, mesActual: mes, anioActual: anio }));
  }, []);

  const recargar = useCallback(() => {
    void cargarDatos(state.mesActual, state.anioActual);
  }, [cargarDatos, state.mesActual, state.anioActual]);

  return {
    ...state,
    cambiarPeriodo,
    recargar,
  };
}
