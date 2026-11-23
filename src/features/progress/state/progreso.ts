// Lo que se ve en Progreso: lo de Comida (peso, lo que comes, la cintura de la consulta y tu cuerpo), lo de Entreno (tus
// etapas, tu fuerza, tus entrenos y tus récords), tus medidas, tus fotos y tus ajustes de la composición. Lo carga y guarda
// use-cases/progress.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { localDate } from '../../../shared/lib/format.ts'
import type { ComidaParaProgreso } from '../../nutrition/index.ts'
import type { DetalleMeso, EntrenoParaProgreso, TarjetaMeso } from '../../training/index.ts'
import { composicionDe, evolucionDe, type Calibracion } from '../domain/composition.ts'
import { cuandoToca, PERIMETROS, resumenMedidas, serieDe, type Medida } from '../domain/measures.ts'
import type { Sensaciones } from '../domain/feelings.ts'
import type { Foto } from '../domain/photos.ts'
import { comidaEnTramo, cuerpoEnTramo, diasConFotosEn, fotosEnTramo, type Tramo } from '../domain/stage.ts'

export {
  diasDelMes,
  LIMITES_CM,
  PERIMETROS,
  serieDe,
  type Medida,
  type PerimetroId,
} from '../domain/measures.ts'
export { OBJETIVOS_GRASA, NECESARIAS, pesoConGrasa, semanasHasta } from '../domain/composition.ts'
export { fotosPorMes, POSES, type Pose } from '../domain/photos.ts'
export { laVezAnterior } from '../domain/day.ts'
export {
  contestadas,
  PREGUNTAS,
  resumenSensaciones,
  type PreguntaId,
  type Respuesta,
  type Sensaciones,
} from '../domain/feelings.ts'
export {
  cifrasDe,
  desdeElPrincipio,
  ejercicioEnMes,
  fotosDelTramo,
  frenteALaAnterior,
  fuerzaDelMes,
  mesComoTramo,
  mesesEntre,
  otroMes,
  type Cifras,
  type FilaCuerpo,
  type Tramo,
} from '../domain/stage.ts'

export const estado = signal<'cargando' | 'listo'>('cargando')
export const hoy = signal(localDate())
export const comida = signal<ComidaParaProgreso | null>(null)
export const entreno = signal<EntrenoParaProgreso | null>(null)
export const medidas = signal<Medida[]>([])
/** ¿Cómo estás hoy? de cada día (lo apuntas en Hoy). */
export const sensaciones = signal<Sensaciones[]>([])

/** Una foto de progreso con su imagen ya abierta (`url`). */
export type FotoVista = Foto & { url: string }
export const fotos = signal<FotoVista[]>([])

/**
 * Tus ajustes del cuerpo: la calibración con una medida real, tu objetivo de grasa y el día del mes que eliges para tus
 * medidas y fotos (null: a los 28 días de la última vez).
 */
export type AjustesCuerpo = {
  calibracion: Calibracion | null
  objetivo: number | null
  diaMedidas: number | null
}
export const ajustesCuerpo = signal<AjustesCuerpo>({ calibracion: null, objetivo: null, diaMedidas: null })

/** El detalle del mesociclo abierto (null si no existe; 'cargando' mientras llega). */
export const detalle = signal<DetalleMeso | null | 'cargando'>('cargando')
/** Las fotos de las sesiones del mesociclo abierto (sigla → dirección de la imagen en memoria). */
export const fotosRutina = signal<Record<string, string>>({})

const cinturas = () => comida.value?.cinturas ?? []

/** Cada perímetro con su última medida y su cambio (la cintura, también la de la consulta). */
export const resumen = computed(() => resumenMedidas(medidas.value, cinturas()))

/** Cuándo tocan tus medidas y tus fotos (cada mes, el día que elijas). */
export const toca = computed(() =>
  cuandoToca(
    [...medidas.value.map((m) => m.date), ...fotos.value.map((f) => f.date)],
    hoy.value,
    ajustesCuerpo.value.diaMedidas,
  ),
)

/** Tu peso de tendencia de hoy (el último). */
export const pesoActual = computed(() => comida.value?.serie.at(-1)?.tendencia ?? null)

/** Tu composición de hoy (null si faltan tus datos de Nutrición o alguna medida). */
export const composicion = computed(() => {
  const c = comida.value?.cuerpo
  const peso = pesoActual.value
  if (!c || !peso) return null
  const r = resumen.value
  return composicionDe({
    sexo: c.sexo,
    alturaCm: c.alturaCm,
    pesoKg: peso,
    cuello: r.cuello?.cm ?? null,
    cintura: r.cintura?.cm ?? null,
    cadera: r.cadera?.cm ?? null,
    calibracion: ajustesCuerpo.value.calibracion,
  })
})

/** Tu grasa y tu masa magra cada vez que mediste el cuello. */
export const evolucion = computed(() => {
  const c = comida.value?.cuerpo
  if (!c) return []
  return evolucionDe({
    sexo: c.sexo,
    alturaCm: c.alturaCm,
    cuello: serieDe('cuello', medidas.value),
    cintura: serieDe('cintura', medidas.value, cinturas()),
    cadera: serieDe('cadera', medidas.value),
    peso: comida.value?.serie ?? [],
    calibracion: ajustesCuerpo.value.calibracion,
  })
})

/** Lo que te dio una etapa: tu cuerpo al empezar y ahora, tu comida de media y tus fotos de antes y de ahora. */
export function enEtapa(tramo: Tramo) {
  return {
    cuerpo: cuerpoEnTramo(
      {
        peso: comida.value?.serie ?? [],
        grasa: evolucion.value,
        medidas: medidas.value,
        cinturas: cinturas(),
      },
      tramo,
    ),
    comida: comidaEnTramo(comida.value?.dias ?? [], tramo),
    fotos: fotosEnTramo(fotos.value, tramo),
    diasConFotos: diasConFotosEn(fotos.value, tramo),
  }
}

/** El primer mes con algo tuyo (pesajes, entrenos, medidas o fotos); sin nada, el de hoy. */
export const primerMes = computed(() => {
  const fechas = [
    ...(comida.value?.serie ?? []).map((p) => p.date),
    ...(entreno.value?.entrenos ?? []).map((x) => x.fecha),
    ...medidas.value.map((m) => m.date),
    ...fotos.value.map((f) => f.date),
  ].sort()
  return (fechas[0] ?? hoy.value).slice(0, 7)
})

/** La etapa (tu mesociclo) de un mes: la última que empezó antes de que acabara y no había acabado al empezar. */
export function etapaDelMes(mes: string): TarjetaMeso | null {
  const e = entreno.value
  const todas = [...(e?.mesoActual ? [e.mesoActual] : []), ...(e?.anteriores ?? [])]
  return (
    todas
      .filter((m) => m.inicio <= `${mes}-31` && (!m.fin || m.fin >= `${mes}-01`))
      .sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null
  )
}

/** Un punto de una gráfica: el día, el valor de la línea y el dato suelto (el pesaje del día). */
export type PuntoGrafica = { date: string; v: number; dato: number | null }

/** La serie de una medida: tu peso de tendencia (con tus pesajes), tu grasa estimada o un perímetro. */
export function serieDeMedida(id: string): PuntoGrafica[] {
  if (id === 'peso')
    return (comida.value?.serie ?? []).map((p) => ({ date: p.date, v: p.tendencia, dato: p.kg }))
  if (id === 'grasa') return evolucion.value.map((x) => ({ date: x.date, v: x.grasa, dato: x.grasa }))
  const perimetro = PERIMETROS.find((p) => p.id === id)
  if (!perimetro) return []
  return serieDe(perimetro.id, medidas.value, cinturas()).map((x) => ({ date: x.date, v: x.cm, dato: x.cm }))
}

/** Tu peso de tendencia y tu cintura de un día (lo último que había ese día; null si aún nada). */
export function cuerpoEl(fecha: string) {
  const ultimo = (id: string) =>
    serieDeMedida(id)
      .filter((p) => p.date <= fecha)
      .at(-1)?.v ?? null
  return { peso: ultimo('peso'), cintura: ultimo('cintura') }
}
