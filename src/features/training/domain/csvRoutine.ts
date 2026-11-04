// Tu rutina desde un CSV (Elegir rutina · «Cargar tu rutina»): una fila por ejercicio con su sesión, en el orden en que la
// haces. Columnas (da igual mayúsculas y tildes): sesión, ejercicio, series, repeticiones, RIR, descanso (y notas, si
// quieres). Una fila con «Descanso» en la columna de la sesión es un día de descanso en ese punto de la semana.
import type { Day, Exercise, ProgramData, Session } from './program.ts'

/** Las rutinas cargadas por ti llevan este principio en su id (en `programs` y en el plan). */
export const PREFIJO_MIA = 'mia:'

/** Una rutina tuya guardada en `programs`: el programa con su nombre. */
export type RutinaMia = ProgramData & { id: string; title: string }

export type RutinaCsv = { programa: ProgramData; sesiones: number; ejercicios: number; errores: string[] }

const COLUMNAS = {
  sesion: ['sesion', 'dia', 'entreno'],
  ejercicio: ['ejercicio', 'nombre'],
  series: ['series'],
  reps: ['repeticiones', 'reps'],
  rir: ['rir', 'del fallo', 'reserva'],
  descanso: ['descanso'],
  notas: ['notas', 'nota'],
} as const

const limpio = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Una línea en celdas: separadas por `sep`; las comillas dobles agrupan (y "" es una comilla). */
function celdas(linea: string, sep: string): string[] {
  const out: string[] = []
  let actual = ''
  let comillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"' && comillas && linea[i + 1] === '"') {
      actual += '"'
      i++
    } else if (c === '"') comillas = !comillas
    else if (c === sep && !comillas) {
      out.push(actual.trim())
      actual = ''
    } else actual += c
  }
  out.push(actual.trim())
  return out
}

/** «2:30» → 150; «90» o «90 s» → 90; «2 min» o «2» (hasta 10, en minutos) → 120. null si no se entiende. */
export function segundosDeDescanso(texto: string): number | null {
  const t = limpio(texto).replace(',', '.')
  if (!t) return null
  const reloj = /^(\d+):(\d{1,2})$/.exec(t)
  if (reloj) return Number(reloj[1]) * 60 + Number(reloj[2])
  const n = /^(\d+(?:\.\d+)?)\s*(s|seg|segundos|min|m|minutos)?$/.exec(t)
  if (!n) return null
  const v = Number(n[1])
  if (n[2] && n[2].startsWith('s')) return Math.round(v)
  if (n[2] || v <= 10) return Math.round(v * 60)
  return Math.round(v)
}

/** Lee el CSV: el programa (una semana que se repite), cuántas sesiones y ejercicios, y lo que no se pudo leer. */
export function leerRutinaCsv(texto: string): RutinaCsv {
  const lineas = texto
    // Sin la marca de orden de bytes que pone Excel al principio
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
  const errores: string[] = []
  const vacio = (): RutinaCsv => ({ programa: { blocks: [] }, sesiones: 0, ejercicios: 0, errores })
  if (lineas.length < 2) {
    errores.push('El archivo está vacío: hace falta la fila de títulos y al menos un ejercicio.')
    return vacio()
  }
  const sep = (lineas[0].match(/;/g)?.length ?? 0) >= (lineas[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const titulos = celdas(lineas[0], sep).map(limpio)
  const col = Object.fromEntries(
    Object.entries(COLUMNAS).map(([k, nombres]) => [
      k,
      titulos.findIndex((t) => nombres.some((n) => t === n)),
    ]),
  ) as Record<keyof typeof COLUMNAS, number>
  for (const k of ['sesion', 'ejercicio'] as const)
    if (col[k] < 0) errores.push(`Falta la columna «${k === 'sesion' ? 'sesión' : 'ejercicio'}».`)
  if (errores.length) return vacio()

  const dias: Day[] = []
  let sesion: Session | null = null
  lineas.slice(1).forEach((linea, i) => {
    const fila = i + 2
    const c = celdas(linea, sep)
    const dato = (k: keyof typeof COLUMNAS) => (col[k] >= 0 ? (c[col[k]] ?? '') : '')
    const nombreSesion = dato('sesion')
    if (limpio(nombreSesion) === 'descanso') {
      dias.push({ rest: true })
      sesion = null
      return
    }
    if (!nombreSesion) return void errores.push(`Fila ${fila}: falta la sesión.`)
    const nombre = dato('ejercicio')
    if (!nombre) return void errores.push(`Fila ${fila}: falta el ejercicio.`)
    const series = dato('series')
    if (series && !/^\d+$/.test(series)) errores.push(`Fila ${fila}: «${series}» no es un número de series.`)
    const reps = dato('reps').replace(/\s*[-–a]\s*/g, '-')
    // Un rango («8-12»), un número o una por serie («4,6,8»: cada serie distinta)
    if (reps && !/^\d+(-\d+)?$/.test(reps) && !/^\d+\+?(\s*,\s*\d+\+?)+$/.test(reps))
      errores.push(`Fila ${fila}: «${dato('reps')}» no son repeticiones (8, 8-12 o una por serie: 4,6,8).`)
    const rir = dato('rir')
    if (rir && !/^\d$/.test(rir)) errores.push(`Fila ${fila}: el RIR «${rir}» tiene que ser de 0 a 9.`)
    const descanso = dato('descanso')
    const segundos = descanso ? segundosDeDescanso(descanso) : null
    if (descanso && segundos === null)
      errores.push(`Fila ${fila}: no entiendo el descanso «${descanso}» (2:30, 90 s o 2 min).`)
    if (!sesion || sesion.name !== nombreSesion) {
      sesion = { name: nombreSesion, exercises: [] }
      dias.push(sesion)
    }
    const e: Exercise = {
      name: nombre,
      sets: series ? Number(series) : null,
      reps: reps || null,
      // El programa guarda el esfuerzo como RPE (10 − RIR)
      rpe: rir ? String(10 - Number(rir)) : null,
      rest: segundos !== null ? `${Math.round((segundos / 60) * 100) / 100} min` : null,
      ...(dato('notas') ? { notes: dato('notas') } : {}),
    }
    sesion.exercises.push(e)
  })
  const sesiones = dias.filter((d): d is Session => 'exercises' in d)
  if (!sesiones.length) errores.push('No hay ningún ejercicio.')
  return {
    programa: { blocks: [{ title: null, weeks: [{ week: 1, days: dias }] }] },
    sesiones: sesiones.length,
    ejercicios: sesiones.reduce((n, s) => n + s.exercises.length, 0),
    errores,
  }
}
