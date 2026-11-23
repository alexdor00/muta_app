// Lo que Progreso necesita de Entreno (por el index.ts del área): tus mesociclos —tus etapas— con su fuerza (con su
// detalle y la comparación de dos), tu fuerza semana a semana y desde que empezaste, tus entrenos (el calendario) y el
// récord del básico de cada grupo. Lee tu plan con cargarPlan(); solo guarda lo de tus mesociclos (use-cases/mesocycles.ts).
import { formatDecimal } from '../../../shared/lib/format.ts'
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
import {
  balanceDe,
  comparar,
  veredictoComparado,
  type Balance,
  type BarraComparada,
} from '../domain/mesocycleReview.ts'
import { MUSCLES, type MuscleId } from '../domain/muscles.ts'
import {
  basicosDe,
  ejerciciosEnElTiempo,
  fuerzaEnTramo,
  fuerzaPorSemana,
  type BasicoEnTramo,
  type EjercicioEnElTiempo,
} from '../domain/strengthHistory.ts'
import { progresoDeSesion, type Entreno } from '../domain/workoutHistory.ts'
import type { SerieHecha } from '../domain/workoutSet.ts'
import { rangoMusculo } from '../state/musculos.ts'
import { entrenos, tonoDe, type Tono } from '../state/plan.ts'
import { idPorNombre, porNombre } from './exerciseLibrary.ts'
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
const basicos = () => basicosDe(entrenos.value, esCompuesto)

/** Tu fuerza en un tramo, con la ficha de cada básico. */
function fuerzaDe(desde: string | null, hasta: string | null): FuerzaTramo | null {
  const f = fuerzaEnTramo(entrenos.value, basicos(), desde, hasta)
  return f && { ...f, basicos: f.basicos.map((b) => ({ ...b, ejercicioId: idPorNombre(b.nombre) })) }
}

const aEntrenoDelDia = (x: Entreno): EntrenoDelDia => ({
  id: x.id,
  fecha: x.fecha,
  sigla: x.sigla,
  veces: progresoDeSesion(entrenos.value, x.sigla).filter((v) => v.fecha <= x.fecha),
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
}

async function buscar(id: string, hoy: string): Promise<Mesociclo | null> {
  const { actual, archivados } = await mesociclosAlDia(hoy)
  return [actual, ...archivados].find((m) => m?.id === id) ?? null
}

/** El detalle de un mesociclo: Constancia, Músculos y Rutina. null si no existe. */
export async function mesocicloParaProgreso(
  id: string,
  hoy: string,
  peso: PesoEnTramo,
): Promise<DetalleMeso | null> {
  const m = await buscar(id, hoy)
  if (!m) return null
  const lista = entrenos.value
  const suyos = entrenosDe(m, lista, hoy)
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
  }
}

export type Comparacion = {
  a: TarjetaMeso
  b: TarjetaMeso
  barras: BarraComparada[]
  veredicto: string
  /** Cuánto cambió tu peso en cada uno (null sin pesajes). */
  peso: { a: number | null; b: number | null }
  /** Los ejercicios que hiciste en los dos, con su mejor 1RM estimado en cada uno. */
  comunes: { nombre: string; a: number; b: number }[]
}

/** Compara dos mesociclos por semana (duran distinto). null si alguno no existe. */
export async function compararParaProgreso(
  idA: string,
  idB: string,
  hoy: string,
  peso: PesoEnTramo,
): Promise<Comparacion | null> {
  const [ma, mb] = [await buscar(idA, hoy), await buscar(idB, hoy)]
  if (!ma || !mb) return null
  const lista = entrenos.value
  const [ra, rb] = [resumenDe(ma, lista, hoy), resumenDe(mb, lista, hoy)]
  const [wa, wb] = [semanasQueDura(ma, hoy), semanasQueDura(mb, hoy)]
  const f = (n: number) => formatDecimal(Math.round(n * 10) / 10)
  const barras = [
    comparar(
      'Sesiones por semana',
      ra.sesiones / wa,
      rb.sesiones / wb,
      f(ra.sesiones / wa),
      f(rb.sesiones / wb),
    ),
    comparar(
      'Toneladas por semana',
      ra.toneladas / wa,
      rb.toneladas / wb,
      f(ra.toneladas / wa),
      f(rb.toneladas / wb),
    ),
    comparar('Récords por semana', ra.records / wa, rb.records / wb, f(ra.records / wa), f(rb.records / wb)),
    // Lo que hace crecer es el volumen que acumulas (04-guia § 5), no que suba cada ejercicio
    comparar('Series por semana', ra.series / wa, rb.series / wb, f(ra.series / wa), f(rb.series / wb)),
  ]
  const cambio = (m: Mesociclo) => {
    const p = peso(m.inicio, m.fin ?? hoy)
    return p ? Math.round((p.fin - p.inicio) * 10) / 10 : null
  }
  const deB = new Map(rb.ejercicios.map((e) => [e.nombre, e.mejor]))
  return {
    a: tarjeta(ma, hoy),
    b: tarjeta(mb, hoy),
    barras,
    veredicto: veredictoComparado(barras, ma.nombre, mb.nombre),
    peso: { a: cambio(ma), b: cambio(mb) },
    comunes: ra.ejercicios
      .filter((e) => deB.has(e.nombre))
      .slice(0, 12)
      .map((e) => ({ nombre: e.nombre, a: Math.round(e.mejor), b: Math.round(deB.get(e.nombre) ?? 0) })),
  }
}

/** Para un día de Progreso: la foto de serie de esa sesión (la que le tocó). */
export { encuadreDeEntreno, fotoDeSerieDe } from './sessionPhotos.ts'

/** Para un día de Progreso: la foto de esa sesión (la tuya de esa rutina) o, si no pusiste ninguna, null. */
export async function fotoDeEntreno(programId: string, sigla: string): Promise<Blob | null> {
  return (await fotosDeRutina(programId))[sigla] ?? null
}
