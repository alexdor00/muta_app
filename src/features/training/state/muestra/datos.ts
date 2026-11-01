// DATOS DE PRUEBA, solo para ver cómo queda una pantalla. Escritos a mano, no vienen de ningún documento
// ni de nadie. Esta carpeta (state/muestra/) se borra entera cuando haya datos reales.

/** Una persona que lleva cuatro semanas con «Cuerpo completo A/B» (4 sesiones por semana). */
export const MUESTRA = {
  rutina: 'Cuerpo completo A/B',
  /** Hoy, para que la semana de la pantalla sea siempre la misma. */
  hoy: '2026-10-27',
  sesiones: [
    { sigla: 'A1', nombre: 'Cuádriceps y espalda', ejercicios: 8, series: 20, minutos: 65 },
    { sigla: 'B1', nombre: 'Isquios, glúteo y pecho', ejercicios: 7, series: 24, minutos: 65 },
    { sigla: 'A2', nombre: 'Espalda y cuádriceps', ejercicios: 8, series: 20, minutos: 65 },
    { sigla: 'B2', nombre: 'Pecho, glúteo e isquios', ejercicios: 7, series: 24, minutos: 65 },
  ],
  /** La semana de hoy, de lunes a domingo, tal como la dibuja el diseño. */
  semana: [
    { letra: 'L', dia: 26, sigla: 'A1', estado: 'hecho' },
    { letra: 'M', dia: 27, sigla: 'B1', estado: 'hoy' },
    { letra: 'X', dia: 28, sigla: '', estado: 'descanso' },
    { letra: 'J', dia: 29, sigla: 'A2', estado: 'pendiente' },
    { letra: 'V', dia: 30, sigla: 'B2', estado: 'pendiente' },
    { letra: 'S', dia: 31, sigla: '', estado: 'descanso' },
    { letra: 'D', dia: 1, sigla: '', estado: 'descanso' },
  ],
  /**
   * Series por músculo: las de la sesión de hoy (B1) y las de la semana (A1 hecha + B1 de hoy).
   * Los ids son los de MuscleId (domain/muscles.ts).
   */
  musculos: [
    { id: 'pecho', grupo: 'Pecho', hoy: 3, semana: 3 },
    { id: 'hombro_lat', grupo: 'Hombros', hoy: 5, semana: 5 },
    { id: 'biceps', grupo: 'Brazos', hoy: 9, semana: 9 },
    { id: 'triceps', grupo: 'Brazos', hoy: 0, semana: 2 },
    { id: 'femoral', grupo: 'Piernas', hoy: 5, semana: 5 },
    { id: 'gluteo', grupo: 'Piernas', hoy: 2, semana: 2 },
    { id: 'cuadriceps', grupo: 'Piernas', hoy: 0, semana: 8 },
    { id: 'dorsal', grupo: 'Espalda', hoy: 0, semana: 6 },
    { id: 'espalda_alta', grupo: 'Espalda', hoy: 0, semana: 4 },
  ],
  /** Entrenos terminados (el más antiguo primero) con el tonelaje de cada uno en toneladas. */
  entrenos: [
    { fecha: '2026-10-05', sesion: 'A1', toneladas: 6.2 },
    { fecha: '2026-10-06', sesion: 'B1', toneladas: 6.6 },
    { fecha: '2026-10-08', sesion: 'A2', toneladas: 6.1 },
    { fecha: '2026-10-09', sesion: 'B2', toneladas: 6.8 },
    { fecha: '2026-10-12', sesion: 'A1', toneladas: 6.5 },
    { fecha: '2026-10-13', sesion: 'B1', toneladas: 6.9 },
    { fecha: '2026-10-15', sesion: 'A2', toneladas: 6.4 },
    { fecha: '2026-10-16', sesion: 'B2', toneladas: 7.1 },
    { fecha: '2026-10-19', sesion: 'A1', toneladas: 6.7 },
    { fecha: '2026-10-20', sesion: 'B1', toneladas: 7.3 },
    { fecha: '2026-10-22', sesion: 'A2', toneladas: 6.6 },
    { fecha: '2026-10-23', sesion: 'B2', toneladas: 7.1 },
    { fecha: '2026-10-26', sesion: 'A1', toneladas: 6.9 },
  ],
} as const

export type Periodo = 'hoy' | 'semana'

/** Resumen de la actividad muscular de un periodo, calculado con los datos de prueba. */
export function actividadMuestra(periodo: Periodo) {
  const trabajados = MUESTRA.musculos.filter((m) => m[periodo] > 0)
  return {
    musculos: trabajados.length,
    series: trabajados.reduce((n, m) => n + m[periodo], 0),
    grupos: new Set(trabajados.map((m) => m.grupo)).size,
    porMusculo: Object.fromEntries(trabajados.map((m) => [m.id, m[periodo]])) as Record<string, number>,
  }
}
