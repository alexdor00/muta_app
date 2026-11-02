// DATOS DE PRUEBA, solo para ver cómo queda una pantalla. Escritos a mano, no vienen de ningún documento
// ni de nadie. Esta carpeta (state/muestra/) se borra entera cuando haya datos reales.

/** Un ejercicio de una sesión: series, rango de repeticiones, esfuerzo (lo que queda al fallo) y la última vez. */
export type EjercicioMuestra = {
  nombre: string
  series: number
  reps: string
  /** RIR: repeticiones que quedan al acabar la serie (0 = al fallo). */
  rir: number
  /** Kilos × repeticiones de cada serie la última vez. */
  ultima: string[]
}

// Las sesiones B (isquios, glúteo y pecho) y las A (espalda y cuádriceps); B2 y A1 repiten los de B1 y A2.
const B: EjercicioMuestra[] = [
  {
    nombre: 'Peso muerto rumano',
    series: 3,
    reps: '6–10',
    rir: 2,
    ultima: ['60 × 10', '62,5 × 6', '60 × 7'],
  },
  {
    nombre: 'Press inclinado con mancuernas',
    series: 3,
    reps: '8–12',
    rir: 1,
    ultima: ['26 × 12', '26 × 10', '26 × 9'],
  },
  {
    nombre: 'Curl inclinado con mancuernas',
    series: 5,
    reps: '10–15',
    rir: 0,
    ultima: ['12 × 15', '12 × 13', '12 × 12', '10 × 15', '10 × 13'],
  },
  { nombre: 'Curl femoral tumbado', series: 2, reps: '10–15', rir: 0, ultima: ['45 × 14', '45 × 12'] },
  {
    nombre: 'Curl predicador (Scott)',
    series: 4,
    reps: '10–15',
    rir: 0,
    ultima: ['25 × 15', '25 × 13', '25 × 12', '22,5 × 14'],
  },
  {
    nombre: 'Elevaciones laterales en polea',
    series: 5,
    reps: '10–15',
    rir: 0,
    ultima: ['7,5 × 15', '7,5 × 14', '7,5 × 13', '7,5 × 12', '5 × 15'],
  },
  { nombre: 'Crunch en máquina', series: 2, reps: '10–15', rir: 0, ultima: ['50 × 15', '50 × 14'] },
]
const A: EjercicioMuestra[] = [
  {
    nombre: 'Remo en polea baja',
    series: 3,
    reps: '8–12',
    rir: 1,
    ultima: ['55 × 12', '55 × 11', '55 × 10'],
  },
  { nombre: 'Prensa', series: 3, reps: '6–10', rir: 2, ultima: ['160 × 10', '160 × 9', '160 × 8'] },
  {
    nombre: 'Extensión de tríceps en polea',
    series: 2,
    reps: '10–15',
    rir: 0,
    ultima: ['30 × 15', '30 × 12'],
  },
  {
    nombre: 'Jalón al pecho agarre abierto',
    series: 3,
    reps: '8–12',
    rir: 1,
    ultima: ['60 × 12', '60 × 10', '60 × 9'],
  },
  { nombre: 'Sissy squat', series: 2, reps: '10–15', rir: 1, ultima: ['0 × 15', '0 × 13'] },
  {
    nombre: 'Elevación de talones sentado',
    series: 3,
    reps: '10–15',
    rir: 0,
    ultima: ['40 × 15', '40 × 14', '40 × 12'],
  },
  { nombre: 'Vuelos posteriores', series: 2, reps: '10–15', rir: 1, ultima: ['8 × 15', '8 × 13'] },
]

/** Hoy, para que la semana y el historial de las pantallas sean siempre los mismos. */
const HOY = '2026-10-27'

/** Una persona que lleva seis meses con «Cuerpo completo A/B» (4 sesiones por semana). */
export const MUESTRA = {
  rutina: 'Cuerpo completo A/B',
  hoy: HOY,
  sesiones: [
    { sigla: 'A1', nombre: 'Cuádriceps y espalda', minutos: 56, ejercicios: A },
    { sigla: 'B1', nombre: 'Isquios, glúteo y pecho', minutos: 65, ejercicios: B },
    { sigla: 'A2', nombre: 'Espalda y cuádriceps', minutos: 56, ejercicios: A },
    { sigla: 'B2', nombre: 'Pecho, glúteo e isquios', minutos: 65, ejercicios: B },
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
  /** Entrenos terminados, el más antiguo primero (ver `historial`). */
  entrenos: historial(),
} as const

export type SesionMuestra = (typeof MUESTRA.sesiones)[number]
export type Tono = 1 | 2 | 3 | 4

/**
 * Seis meses de entrenos: cada semana A1 (lunes), B1 (martes), A2 (jueves) y B2 (viernes), con el tonelaje subiendo
 * poco a poco. Las dos últimas B1 dan «7,1 t, −7 % que la anterior», como en el diseño.
 */
function historial() {
  const dias = { A1: 0, B1: 1, A2: 3, B2: 4 } as const
  const base = { A1: 5, B1: 5.4, A2: 4.9, B2: 5.5 } as const
  const lunes = Date.UTC(2026, 9, 26)
  const entrenos: {
    fecha: string
    sesion: keyof typeof dias
    toneladas: number
    reps: number
    minutos: number
  }[] = []
  for (let semana = 26; semana >= 0; semana--) {
    for (const sesion of ['A1', 'B1', 'A2', 'B2'] as const) {
      const dia = lunes - semana * 7 * 86_400_000 + dias[sesion] * 86_400_000
      const fecha = new Date(dia).toISOString().slice(0, 10)
      if (fecha >= HOY) continue
      const vaiven = (((semana * 7) % 5) - 2) * 0.05
      const toneladas = Math.round((base[sesion] + 0.08 * (26 - semana) + vaiven) * 10) / 10
      entrenos.push({
        fecha,
        sesion,
        toneladas,
        reps: Math.round(toneladas * 38),
        minutos: Math.round(52 + toneladas * 1.5 + vaiven * 10),
      })
    }
  }
  const b1 = entrenos.filter((e) => e.sesion === 'B1')
  Object.assign(b1[b1.length - 2], { toneladas: 7.6, reps: 304 })
  Object.assign(b1[b1.length - 1], { toneladas: 7.1, reps: 274 })
  return entrenos
}

/** Color de la tarjeta de una sesión: fijo, por su orden en la rutina (1 lima, 2 rayas, 3 naranja, 4 negro). */
export function tonoDe(sigla: string): Tono {
  const i = MUESTRA.sesiones.findIndex((s) => s.sigla === sigla)
  return ((Math.max(0, i) % 4) + 1) as Tono
}

/** La sesión de una sigla («b1» o «B1»), o null si no existe. */
export function sesionMuestra(sigla: string): SesionMuestra | null {
  return MUESTRA.sesiones.find((s) => s.sigla.toLowerCase() === sigla.toLowerCase()) ?? null
}

/** «7 ejercicios · 24 series · 65 min». */
export function detalleSesion(s: SesionMuestra): string {
  const series = s.ejercicios.reduce((n, e) => n + e.series, 0)
  return `${s.ejercicios.length} ejercicios · ${series} series · ${s.minutos} min`
}

/** Todas las veces que se hizo una sesión (la más antigua primero): tonelaje, repeticiones y minutos de cada una. */
export function progresoMuestra(sigla: string) {
  return MUESTRA.entrenos
    .filter((e) => e.sesion === sigla)
    .map(({ fecha, toneladas, reps, minutos }) => ({ fecha, toneladas, reps, minutos }))
}

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
