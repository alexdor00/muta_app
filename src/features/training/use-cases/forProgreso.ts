// Lo que Progreso necesita de Entreno (por el index.ts del área): tus mesociclos —tus etapas— con su fuerza (con su
// detalle y la comparación de dos), tu fuerza semana a semana y desde que empezaste, tus entrenos (el calendario) y el
// récord del básico de cada grupo. Lee tu plan con cargarPlan(); solo guarda lo de tus mesociclos (use-cases/mesocycles.ts).
import { computed } from '@preact/signals'
import { addDays, formatDecimal } from '../../../shared/lib/format.ts'
import { effortLabel } from '../domain/effort.ts'
import { fotosDeRutina } from './sessionPhotos.ts'
import {
  constanciaDe,
  constanciaPorMes,
  entrenosDe,
  GRUPOS_MUSCULOS,
  musculosDe,
  NOMBRE_OBJETIVO,
  rachaDeSemanas,
  resumenDe,
  semanaActual,
  semanasDe,
  semanasQueDura,
  seriesDeEntreno,
  toneladasDe,
  type Constancia,
  type Mesociclo,
  type MusculoDelMeso,
} from '../domain/mesocycles.ts'
import { GRUPOS_RECORDS, recordsPorGrupo, type RecordGrupo } from '../domain/groupRecords.ts'
import { balanceDe, type Balance } from '../domain/mesocycleReview.ts'
import { compararVueltas, comparables, parejaDe, type Vueltas } from '../domain/vueltas.ts'
import { lunesDe } from '../domain/trainingProgress.ts'
import { MUSCLES, type MuscleId } from '../domain/muscles.ts'
import {
  basicosDe,
  ejerciciosEnElTiempo,
  fuerzaEnTramo,
  fuerzaPorSemana,
  type BasicoEnTramo,
  type EjercicioEnElTiempo,
} from '../domain/strengthHistory.ts'
import { progresoDeSesion, unificarNombres, type Entreno } from '../domain/workoutHistory.ts'
import type { SerieHecha } from '../domain/workoutSet.ts'
import { rangoMusculo } from '../state/musculos.ts'
import { claveEjercicio, entrenos as todos, tonoDe, type Tono } from '../state/plan.ts'

// Para Progreso, cada ejercicio con un solo nombre aunque lo hicieras con otro en otra rutina (usuario, 2026-11-23)
const entrenos = computed(() =>
  unificarNombres(todos.value, claveEjercicio.value, (k) => ejercicioDeBiblioteca(k)?.name ?? null),
)
import { ejercicioDeBiblioteca, idPorNombre, porNombre } from './exerciseLibrary.ts'
import { leerBasicos, mesociclosAlDia } from './mesocycles.ts'
import { cargarPlan } from './training.ts'

/** Un entreno terminado, para el calendario y «Ver qué hice». */
export type EntrenoDelDia = {
  id: string
  fecha: string
  sigla: string
  /** Esa sesión vez a vez hasta ese día (la gráfica de Ver sesión). */
  veces: ReturnType<typeof progresoDeSesion>
  /** La rutina de ese entreno (para la foto de su sesión). */
  programId: string
  /** El color de su sesión en Tu plan (1 lima, 2 rayas, 3 naranja, 4 negro). */
  tono: Tono
  nombre: string
  series: number
  minutos: number
  toneladas: number
  ejercicios: { nombre: string; ejercicioId: string | null; series: SerieHecha[] }[]
}

/** Un mesociclo en una tarjeta: nombre, fechas, objetivo, semana en la que vas y sus cifras. */
export type TarjetaMeso = {
  id: string
  nombre: string
  rutina: string
  inicio: string
  fin: string | null
  objetivo: string | null
  semana: number
  semanas: number
  sesiones: number
  toneladas: number
  records: number
  /** Cuánto cambió tu fuerza en tus básicos (−0,03 es un 3 % menos); null si no se puede saber. */
  fuerza: number | null
}

/** Tus básicos con su 1RM del principio y del final de un tramo, con su ficha. */
export type FuerzaTramo = { cambio: number; basicos: (BasicoEnTramo & { ejercicioId: string | null })[] }

export type EntrenoParaProgreso = {
  /** Entrenos terminados en total. */
  total: number
  /** El mesociclo en curso (null sin rutina) y los archivados, del último al primero. */
  mesoActual: TarjetaMeso | null
  anteriores: TarjetaMeso[]
  /** Todos tus entrenos, del más antiguo al último (el calendario). */
  entrenos: EntrenoDelDia[]
  /** El récord del básico de cada grupo, con su ficha si está en la biblioteca. */
  records: (RecordGrupo & { ejercicioId: string | null })[]
  /** Tu fuerza desde que empezaste (tus básicos de entonces a ahora) y semana a semana (lunes → cambio). */
  fuerzaTotal: FuerzaTramo | null
  fuerzaSemanal: { lunes: string; cambio: number }[]
  /** Tus básicos (los compuestos que más repites) y cada ejercicio con su 1RM de cada día, su grupo muscular y su ficha. */
  basicos: string[]
  ejercicios: (EjercicioEnElTiempo & { grupo: string | null; ejercicioId: string | null })[]
}

/** Si un ejercicio es compuesto (según la biblioteca). */
const esCompuesto = (nombre: string) => porNombre(nombre)?.kind === 'compound'

/** Tus básicos de siempre (los compuestos que más repites). */
const deBasicos = computed(() => basicosDe(entrenos.value, esCompuesto))
const basicos = () => deBasicos.value

/**
 * Cada sesión de cada rutina con su gráfica (`progresoDeSesion`), calculada una vez por sesión: antes se calculaba por cada
 * entreno, y con años de datos Progreso tardaba segundos en abrir (problema 9 de docs/problemas-con-el-tiempo.md).
 */
const porSesion = computed(() => {
  const claves = new Set(entrenos.value.map((x) => `${x.programId}|${x.sigla}`))
  return new Map(
    [...claves].map((k) => {
      const [programId, sigla] = [k.slice(0, k.lastIndexOf('|')), k.slice(k.lastIndexOf('|') + 1)]
      return [k, progresoDeSesion(entrenos.value, sigla, programId)]
    }),
  )
})

/** Tu fuerza en un tramo, con la ficha de cada básico. */
function fuerzaDe(desde: string | null, hasta: string | null): FuerzaTramo | null {
  const f = fuerzaEnTramo(entrenos.value, basicos(), desde, hasta)
  return f && { ...f, basicos: f.basicos.map((b) => ({ ...b, ejercicioId: idPorNombre(b.nombre) })) }
}

const aEntrenoDelDia = (x: Entreno): EntrenoDelDia => ({
  id: x.id,
  fecha: x.fecha,
  sigla: x.sigla,
  veces: (porSesion.value.get(`${x.programId}|${x.sigla}`) ?? []).filter((v) => v.fecha <= x.fecha),
  programId: x.programId,
  tono: tonoDe(x.sigla),
  nombre: x.nombre,
  series: seriesDeEntreno(x),
  minutos: Math.round(x.segundos / 60),
  toneladas: toneladasDe(x),
  ejercicios: x.ejercicios
    .filter((e) => e.series.length)
    .map((e) => ({ nombre: e.nombre, ejercicioId: idPorNombre(e.nombre), series: e.series })),
})

function tarjeta(m: Mesociclo, hoy: string): TarjetaMeso {
  const r = resumenDe(m, entrenos.value, hoy)
  return {
    id: m.id,
    nombre: m.nombre,
    rutina: m.rutina,
    inicio: m.inicio,
    fin: m.fin,
    objetivo: m.objetivo ? NOMBRE_OBJETIVO[m.objetivo] : null,
    semana: semanaActual(m, hoy),
    semanas: semanasQueDura(m, hoy),
    sesiones: r.sesiones,
    toneladas: r.toneladas,
    records: r.records,
    fuerza: fuerzaDe(m.inicio, m.fin ?? hoy)?.cambio ?? null,
  }
}

/** El músculo de un ejercicio: el que se guardó o el principal de la biblioteca. */
const musculoDe = (nombre: string, guardado: MuscleId | null) =>
  guardado ?? porNombre(nombre)?.primary ?? null

export async function entrenoParaProgreso(hoy: string): Promise<EntrenoParaProgreso> {
  await cargarPlan()
  const { actual, archivados } = await mesociclosAlDia(hoy)
  const lista = entrenos.value
  const elegidos = await leerBasicos()
  return {
    total: lista.length,
    mesoActual: actual ? tarjeta(actual, hoy) : null,
    anteriores: archivados.map((m) => tarjeta(m, hoy)).reverse(),
    entrenos: [...lista].sort((a, b) => a.inicio - b.inicio).map(aEntrenoDelDia),
    records: recordsPorGrupo(lista, elegidos, musculoDe, esCompuesto).map((r) => ({
      ...r,
      ejercicioId: r.basico ? idPorNombre(r.basico) : null,
    })),
    fuerzaTotal: fuerzaDe(null, null),
    fuerzaSemanal: fuerzaPorSemana(lista, basicos()),
    basicos: basicos(),
    ejercicios: ejerciciosEnElTiempo(lista, musculoDe).map((x) => ({
      ...x,
      grupo: GRUPOS_RECORDS.find((g) => x.musculo && g.musculos.includes(x.musculo))?.nombre ?? null,
      ejercicioId: idPorNombre(x.nombre),
    })),
  }
}

/** Tu peso (tendencia) al empezar y al acabar un tramo, si hay pesajes (lo da Comida a Progreso). */
export type PesoEnTramo = (desde: string, hasta: string) => { inicio: number; fin: number } | null

export type DetalleMeso = {
  meso: TarjetaMeso & { enCurso: boolean }
  porSemana: number
  constancia: Constancia
  /** La constancia de cada mes (AAAA-MM) de la etapa: cada semana, en el mes de su jueves. */
  porMes: Record<string, Constancia>
  /** Semanas seguidas con las sesiones de tu plan o más (dentro de este mesociclo). */
  racha: number
  semanas: {
    numero: number
    lunes: string
    domingo: string
    enCurso: boolean
    series: number
    toneladas: number
    entrenos: EntrenoDelDia[]
  }[]
  /** Series directas por semana de cada músculo frente a su rango, por grupos (null sin entrenos). */
  musculos: { grupo: string; enRango: number; filas: (MusculoDelMeso & { nombre: string })[] }[] | null
  /** Sus sesiones tal como las hiciste, con la carga de la primera y la última vez. */
  rutina: {
    sigla: string
    nombre: string
    veces: number
    /** Tu foto de la sesión (la de Editar rutina), si le pusiste una. */
    foto: Blob | null
    ejercicios: {
      nombre: string
      ejercicioId: string | null
      pauta: string
      primera: SerieHecha | null
      ultima: SerieHecha | null
      veces: number
    }[]
  }[]
  /** El balance (para cerrarlo: «Nuevo mesociclo»). */
  balance: Balance[]
  /** Tu fuerza en la etapa: tus básicos de su principio a su final. */
  fuerza: FuerzaTramo | null
  /** Con cuál se compara de serie (la misma rutina; primero, el mismo objetivo) y cuántas hay con su rutina. */
  pareja: { id: string; nombre: string } | null
  comparables: { id: string; nombre: string }[]
}

async function todas(hoy: string): Promise<Mesociclo[]> {
  const { actual, archivados } = await mesociclosAlDia(hoy)
  return [...archivados, ...(actual ? [actual] : [])]
}

async function buscar(id: string, hoy: string): Promise<Mesociclo | null> {
  return (await todas(hoy)).find((m) => m.id === id) ?? null
}

/** El detalle de un mesociclo: Constancia, Músculos y Rutina. null si no existe. */
export async function mesocicloParaProgreso(
  id: string,
  hoy: string,
  peso: PesoEnTramo,
): Promise<DetalleMeso | null> {
  const lasEtapas = await todas(hoy)
  const m = lasEtapas.find((x) => x.id === id)
  if (!m) return null
  const lista = entrenos.value
  const suyos = entrenosDe(m, lista, hoy)
  const pareja = parejaDe(m, lasEtapas)
  const semanas = semanasDe(m, lista, hoy)
  const porSemana = m.sesionesPorSemana
  const resumen = resumenDe(m, lista, hoy)
  const musculos = musculosDe(
    semanas,
    (n) => porNombre(n)?.contributes ?? null,
    (x) => rangoMusculo(x).rango,
  )
  const fotos = await fotosDeRutina(m.programId)
  const porEjercicio = new Map(resumen.ejercicios.map((e) => [e.nombre, e]))
  const fin = m.fin ?? hoy
  const grupos = musculos
    ? GRUPOS_MUSCULOS.map(([grupo, ids]) => {
        const filas = musculos
          .filter((x) => ids.includes(x.musculo) && (x.series || x.indirectas || x.rango[1] > 0))
          .map((x) => ({ ...x, nombre: MUSCLES[x.musculo].label }))
        return {
          grupo,
          enRango: filas.filter((x) => x.estado === 'ok' || x.estado === 'indirecto').length,
          filas,
        }
      }).filter((g) => g.filas.length)
    : null
  const bajos = musculos
    ? musculos.filter((x) => x.estado === 'bajo' && x.rango[0] > 0).map((x) => MUSCLES[x.musculo].label)
    : []
  return {
    meso: { ...tarjeta(m, hoy), enCurso: !m.fin },
    porSemana,
    constancia: constanciaDe(semanas, porSemana),
    porMes: constanciaPorMes(semanas, porSemana),
    racha: rachaDeSemanas(suyos, porSemana, fin, m.inicio),
    semanas: semanas.map((w) => ({
      numero: w.numero,
      lunes: w.lunes,
      domingo: w.domingo,
      enCurso: w.enCurso,
      series: w.entrenos.reduce((t, x) => t + seriesDeEntreno(x), 0),
      toneladas: w.entrenos.reduce((t, x) => t + toneladasDe(x), 0),
      entrenos: w.entrenos.map(aEntrenoDelDia),
    })),
    musculos: grupos,
    rutina: m.sesiones.map((s) => ({
      sigla: s.sigla,
      nombre: s.nombre,
      veces: suyos.filter((x) => x.sigla === s.sigla).length,
      foto: fotos[s.sigla] ?? null,
      ejercicios: s.ejercicios.map((e) => {
        const r = porEjercicio.get(e.nombre)
        return {
          nombre: e.nombre,
          ejercicioId: idPorNombre(e.nombre),
          pauta: `${e.series} × ${e.reps} · ${effortLabel(e.rir)}`,
          primera: r?.primeraSerie ?? null,
          ultima: r?.ultimaSerie ?? null,
          veces: r?.veces ?? 0,
        }
      }),
    })),
    fuerza: fuerzaDe(m.inicio, fin),
    balance: balanceDe({
      resumen,
      semanas: semanasQueDura(m, hoy),
      objetivo: m.objetivo,
      peso: peso(m.inicio, fin),
      bajos,
      formato: (n) => formatDecimal(Math.round(n * 100) / 100),
    }),
    pareja: pareja && { id: pareja.id, nombre: pareja.nombre },
    comparables: comparables(m, lasEtapas).map((x) => ({ id: x.id, nombre: x.nombre })),
  }
}

/**
 * Dos vueltas de una misma rutina comparadas a la misma semana (usuario, 2026-11-23): `a` es la anterior y `b` la
 * posterior, con su tarjeta, y cuánto cambió tu peso en cada una hasta esa semana.
 */
export type Comparacion = Vueltas & {
  a: TarjetaMeso
  b: TarjetaMeso
  peso: { a: number | null; b: number | null }
}

/** Compara dos etapas con la misma rutina (rutinas distintas no se comparan: null). */
export async function compararParaProgreso(
  idA: string,
  idB: string,
  hoy: string,
  peso: PesoEnTramo,
): Promise<Comparacion | null> {
  const [x, y] = [await buscar(idA, hoy), await buscar(idB, hoy)]
  if (!x || !y || x.programId !== y.programId || x.id === y.id) return null
  const [antes, ahora] = x.inicio <= y.inicio ? [x, y] : [y, x]
  const v = compararVueltas(antes, ahora, entrenos.value, hoy, basicos())
  if (!v) return null
  // El peso hasta la misma semana de cada una
  const cambio = (m: Mesociclo) => {
    const p = peso(m.inicio, minFecha(addDays(lunesDe(m.inicio), 7 * v.semana - 1), m.fin ?? hoy))
    return p ? Math.round((p.fin - p.inicio) * 10) / 10 : null
  }
  return {
    ...v,
    a: tarjeta(antes, hoy),
    b: tarjeta(ahora, hoy),
    peso: { a: cambio(antes), b: cambio(ahora) },
  }
}

const minFecha = (a: string, b: string) => (a < b ? a : b)

/** Para un día de Progreso: la foto de serie de esa sesión (la que le tocó). */
export { encuadreDeEntreno, fotoDeSerieDe } from './sessionPhotos.ts'

/** Para un día de Progreso: la foto de esa sesión (la tuya de esa rutina) o, si no pusiste ninguna, null. */
export async function fotoDeEntreno(programId: string, sigla: string): Promise<Blob | null> {
  return (await fotosDeRutina(programId))[sigla] ?? null
}
