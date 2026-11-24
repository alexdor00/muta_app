// El entrenador de Entreno en Tu plan: lo que manda esta semana (domain/coach/semana.ts), los consejos por músculo que aún
// no has aplicado ni dejado (domain/coach/revision.ts) y el informe que los resume, con tus entrenos, tu plan, tus
// músculos y lo que da Nutrición (`deNutricion`: tu fase, la recarga, tu comida y cómo estás; usuario, 2026-11-23: «que
// hagan equipo»).
import { computed, signal } from '@preact/signals'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import {
  lunesDe,
  mejoraPorMusculo,
  revisionEntrenador,
  type ConsejoEntrenador,
  type Pauta,
  type Semanas,
} from '../domain/coach/revision.ts'
import {
  cercaDelFallo,
  diasDeParon,
  estadoDeLaSemana,
  lejosDelFallo,
  seriesConRir,
  tocaCalibrar,
  type DeNutricion,
  type EstadoSemana,
  type FilaSemana,
} from '../domain/coach/semana.ts'
import { MUSCLES, type MuscleId, type Range } from '../domain/muscles.ts'
import { rangoDe } from '../domain/workoutPlan.ts'
import { faseActual } from './fase.ts'
import { elecciones, rangoMusculo } from './musculos.ts'
import { entrenos, tuPlan } from './plan.ts'

export type { ConsejoEntrenador } from '../domain/coach/revision.ts'
export type { DeNutricion } from '../domain/coach/semana.ts'

/**
 * Lo ya visto: `músculo|lunes|lectura` (aplicado o «Ahora no»), `músculo|lunes|aplicado` (para esperar una semana a ver
 * el efecto) y `paron|día que volviste`. Se guarda en `userContent` (use-cases/entrenador.ts).
 */
export const vistosEntrenador = signal<string[]>([])

/** El último día que aplicaste una serie más (Nutrición lo mira antes de subir kcal en volumen). */
export const ultimaSubida = signal<string | null>(null)

/** Lo que da Nutrición (null sin objetivo de comida o hasta cargarlo). */
export const deNutricion = signal<DeNutricion | null>(null)

/** La marca de un consejo: vale para esa semana y esa lectura (si la semana que viene vuelve a tocar, vuelve a salir). */
export const marcaDe = (c: Pick<ConsejoEntrenador, 'musculo' | 'lectura'>, hoy = localDate()) =>
  `${c.musculo}|${lunesDe(hoy)}|${c.lectura}`
export const marcaAplicado = (musculo: MuscleId, hoy = localDate()) => `${musculo}|${lunesDe(hoy)}|aplicado`
export const marcaParon = (vuelta: string) => `paron|${vuelta}`

const NOMBRE_FASE = { definicion: 'Definición', mantenimiento: 'Mantenimiento', volumen: 'Volumen' } as const

/** Lo que manda esta semana (parón, constancia, RIR, recarga, cómo estás…), con lo que da Nutrición. */
export const semanaEntrenador = computed<
  (EstadoSemana & { paron: { dias: number; vuelta: string } | null }) | null
>(() => {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return null
  const hoy = localDate()
  const desde = addDays(hoy, -6)
  const lista = entrenos.value
  const rir = new Map<string, number>()
  for (const s of plan.semana) for (const e of s.ejercicios) rir.set(e.nombre, e.rir)
  const paron = diasDeParon(lista, hoy)
  const yaVisto = paron && vistosEntrenador.value.includes(marcaParon(paron.vuelta))
  const estado = estadoDeLaSemana({
    hoy,
    sesiones: lista.filter((x) => x.fecha >= desde && x.fecha <= hoy).length,
    objetivo: Math.min(7, plan.semana.length),
    rir: seriesConRir(lista, desde, hoy),
    lejos: lejosDelFallo(lista, desde, hoy, (n) => rir.get(n)),
    paron: yaVisto ? null : paron,
    nutricion: deNutricion.value,
  })
  return { ...estado, paron: yaVisto ? null : paron }
})

export const consejosEntrenador = computed<ConsejoEntrenador[]>(() => {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return []
  const hoy = localDate()
  const pautas: Record<string, Pauta> = {}
  for (const s of plan.semana)
    for (const e of s.ejercicios) pautas[e.nombre] = { rango: rangoDe(e.reps), rir: e.rir }
  // Cuatro semanas de 7 días hacia atrás: la de ahora primero
  const semana = (n: number) =>
    mejoraPorMusculo(entrenos.value, addDays(hoy, -7 * n - 6), addDays(hoy, -7 * n), pautas)
  const [s0, s1, s2, s3] = [semana(0), semana(1), semana(2), semana(3)]
  const semanas: Partial<Record<MuscleId, Semanas>> = {}
  for (const m of Object.keys(s0) as MuscleId[]) semanas[m] = [s0[m], s1[m], s2[m], s3[m]]
  const vistos = new Set(vistosEntrenador.value)
  const pasada = addDays(hoy, -7)
  const aplicadoHace = new Set(
    (Object.keys(s0) as MuscleId[]).filter((m) => vistos.has(marcaAplicado(m, pasada))),
  )
  const modos = Object.fromEntries(Object.entries(elecciones.value).map(([m, e]) => [m, e?.modo]))
  // Las series directas de cada músculo en tu semana y su rango (la ficha del músculo lo enseña igual)
  const rangos: Partial<Record<MuscleId, { series: number; rango: Range }>> = {}
  for (const s of plan.semana)
    for (const e of s.ejercicios) {
      if (!e.musculo) continue
      const r = rangos[e.musculo] ?? { series: 0, rango: rangoMusculo(e.musculo).rango }
      rangos[e.musculo] = { ...r, series: r.series + e.series }
    }
  const sem = semanaEntrenador.value
  const n = deNutricion.value
  // Los ejercicios que van más al fallo de lo que toca, por su músculo (si vas peor, es lo primero que se mira)
  const rirPauta = new Map<string, number>()
  const musculoDe = new Map<string, MuscleId>()
  for (const s of plan.semana)
    for (const e of s.ejercicios) {
      rirPauta.set(e.nombre, e.rir)
      if (e.musculo) musculoDe.set(e.nombre, e.musculo)
    }
  const alFallo: Partial<Record<MuscleId, string[]>> = {}
  for (const nombre of cercaDelFallo(entrenos.value, addDays(hoy, -6), hoy, (x) => rirPauta.get(x))) {
    const m = musculoDe.get(nombre)
    if (m) alFallo[m] = [...(alFallo[m] ?? []), nombre]
  }
  return revisionEntrenador({
    alFallo,
    semanas,
    semana: plan.semana,
    definicion: n ? n.fase === 'definicion' : faseActual.value === 'cut',
    modos,
    aplicadoHace,
    sinSubir: sem?.sinSubir,
    sinQuitar: sem?.sinQuitar,
    comida: n?.comida ?? null,
    rangos,
  }).filter((c) => !vistos.has(marcaDe(c, hoy)))
})

/** El informe de arriba de la tarjeta: estado, titular, cifras, nota y «Esta semana». null si no hay nada que leer. */
export const informeEntrenador = computed(() => {
  const sem = semanaEntrenador.value
  const plan = tuPlan.value
  if (!sem || plan.status !== 'ready') return null
  const hoy = localDate()
  const consejos = consejosEntrenador.value
  const n = deNutricion.value
  const conEntrenos = entrenos.value.some((x) => x.fecha >= addDays(hoy, -6))
  if (!conEntrenos && sem.foco !== 'paron') return null
  const lineas: string[] = []
  // Lo que funciona: no se toca (02-reglas § 5, «resumen positivo»)
  const progresan = consejos.filter((c) => c.lectura === 'dulce').map((c) => MUSCLES[c.musculo].label)
  if (progresan.length)
    lineas.push(`Progresan ${progresan.slice(0, 3).join(', ').toLowerCase()}: no toques lo que funciona.`)
  if (n?.comida && sem.foco === 'normal') lineas.push(n.comida)
  // Constancia: con menos sesiones que tu semana, se lee peor (02-reglas § 4: tus sesiones por semana)
  const hechas = entrenos.value.filter((x) => x.fecha >= addDays(hoy, -6) && x.fecha <= hoy).length
  const objetivo = Math.min(7, plan.semana.length)
  if (hechas < objetivo && sem.foco === 'normal')
    lineas.push(`Llevas ${hechas} de ${objetivo} sesiones en 7 días: con todas, tu entrenador acierta más.`)
  // Demasiado cerca del fallo (guía § 3; 02-reglas § 5): esas series no cuentan para tu entrenador y restan tonelaje
  const rir = new Map<string, number>()
  for (const s of plan.semana) for (const e of s.ejercicios) rir.set(e.nombre, e.rir)
  const cerca = cercaDelFallo(entrenos.value, addDays(hoy, -6), hoy, (x) => rir.get(x))
  if (cerca.length)
    lineas.push(
      `Vas más al fallo de lo que toca en ${cerca.slice(0, 2).join(' y ')}: dosificar el RIR saca más tonelaje.`,
    )
  // Cada 4 vueltas, comprobar tu RIR (02-reglas § 5)
  const sesiones = plan.semana.length
  if (tocaCalibrar(entrenos.value.length, sesiones)) {
    const estables = plan.semana
      .flatMap((s) => s.ejercicios)
      .filter((e) => !e.compuesto)
      .slice(0, 2)
      .map((e) => e.nombre)
    if (estables.length)
      lineas.push(
        `Comprueba tu RIR: en ${estables.join(' y ')}, la última serie al fallo técnico; apunta antes las que crees que quedan.`,
      )
  }
  // Técnicas de intensidad en definición: casi nunca compensan (guía § 3)
  const enDefi = n ? n.fase === 'definicion' : faseActual.value === 'cut'
  const tecnicas = plan.semana.flatMap((s) => s.ejercicios).filter((e) => e.tecnica).length
  if (enDefi && tecnicas)
    lineas.push(
      `${tecnicas} ${tecnicas === 1 ? 'ejercicio lleva' : 'ejercicios llevan'} dropset o similar: en definición casi nunca compensa.`,
    )

  // Lo que manda la semana, con su titular; si además hay una propuesta de un músculo (recuperar), la pastilla lo dice
  const propuestas = consejos.filter((c) => c.propuesta).length
  // Lejos del fallo: no se cambia la rutina («acércate al RIR antes de cambiar nada», 02-reglas § 5), pero cada ejercicio
  // dice qué hacer y lleva a dónde se edita (usuario, 2026-11-23)
  const musculoDe = new Map<string, MuscleId>()
  for (const s of plan.semana) for (const e of s.ejercicios) if (e.musculo) musculoDe.set(e.nombre, e.musculo)
  const apurar =
    sem.foco === 'fallo'
      ? lejosDelFallo(entrenos.value, addDays(hoy, -6), hoy, (x) => rir.get(x)).flatMap((x) => {
          const musculo = musculoDe.get(x.nombre)
          return musculo ? [{ ...x, musculo }] : []
        })
      : []
  if (sem.foco !== 'normal')
    return {
      ...sem,
      apurar,
      estado:
        propuestas && sem.foco !== 'paron'
          ? `${propuestas} ${propuestas === 1 ? 'sugerencia' : 'sugerencias'}`
          : sem.estado,
      destacado: sem.foco === 'paron' || propuestas > 0,
      lineas,
      recarga: sem.foco === 'finDefi',
    }
  const principal = consejos.find((c) => c.propuesta) ?? null
  const ref = principal ?? consejos[0] ?? null
  const filas: FilaSemana[] = [
    ...(ref
      ? [
          {
            etiqueta: `${MUSCLES[ref.musculo].label}: series que mejoran`,
            valor: `${Math.round((ref.mejora.mejoran / ref.mejora.comparables) * 100)} %`,
            bien: ref.lectura === 'subir' || ref.lectura === 'dulce',
          },
        ]
      : []),
    ...sem.filas,
    ...(n ? [{ etiqueta: 'Tu fase', valor: NOMBRE_FASE[n.fase] }] : []),
  ]
  const nombre = principal ? MUSCLES[principal.musculo].label : ''
  const titulo = principal
    ? principal.lectura === 'subir'
      ? `${nombre}: listo para más volumen`
      : principal.lectura === 'cae'
        ? `${nombre}: toca recuperar`
        : `${nombre}: estancado`
    : consejos.some((c) => c.lectura === 'cae')
      ? 'Vigila tu recuperación'
      : consejos.length
        ? 'Vas bien: no se toca nada'
        : 'Aún no hay series que comparar'
  return {
    ...sem,
    estado: principal ? '1 sugerencia' : sem.estado,
    destacado: !!principal,
    titulo,
    filas,
    nota: sem.sinQuitar ? 'Tu comida acaba de cambiar: se espera una semana antes de quitar series.' : null,
    apurar,
    lineas,
    recarga: false,
  }
})
