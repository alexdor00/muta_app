// La consulta semanal con dieta: lo que mira el nutricionista y lo que propone, en el orden de
// docs/conocimiento/02-reglas.md · sección 8 («Consulta semanal con dieta cargada»), y la recuperación que mira el
// entrenador (sección 5, «Señales de mala recuperación»). Solo propone: nada cambia hasta que tú lo aplicas.
import { addDays } from '../../../shared/lib/format.ts'
import type { Apunte, Macros } from './food.ts'
import type { FaseDieta, TipoDia } from './diet.ts'
import type { Pesaje } from './weight.ts'

/** Lo que apuntas en la consulta: la cinta, el sueño y cómo te has sentido (escalas del 1 al 10). */
export type Revision = {
  fecha: string
  cintura: number | null
  sueno: number | null
  hambre: number | null
  energia: number | null
  fatiga: number | null
  dolor: number | null
  ganas: number | null
  estres: number | null
  nota: string
}

export const ESCALAS: {
  id: keyof Omit<Revision, 'fecha' | 'cintura' | 'sueno' | 'nota'>
  nombre: string
  de: string
  a: string
}[] = [
  { id: 'hambre', nombre: 'Hambre', de: 'poca', a: 'mucha' },
  { id: 'energia', nombre: 'Energía', de: 'ninguna', a: 'a tope' },
  { id: 'fatiga', nombre: 'Fatiga y agujetas', de: 'fresco', a: 'destrozado' },
  { id: 'dolor', nombre: 'Dolor articular', de: 'nada', a: 'mucho' },
  { id: 'ganas', nombre: 'Ganas de entrenar', de: 'ningunas', a: 'muchas' },
  { id: 'estres', nombre: 'Estrés', de: 'poco', a: 'mucho' },
]

/** Rangos válidos (sección 9, «Revisión semanal»). */
export const CINTURA = { min: 40, max: 200 }
export const SUENO = { min: 2, max: 14 }

/** Un cambio que propone el nutricionista. */
export type CambioDieta =
  | { tipo: 'kcal'; kcal: Record<TipoDia, number> }
  | { tipo: 'pasos'; pasos: number }
  | { tipo: 'fase'; fase: string }

export type Propuesta = { id: string; titulo: string; detalle: string; cambio: CambioDieta }

export type Metrica = { nombre: string; valor: string; bien: boolean | null }

export type Decision = {
  titulo: string
  detalle: string
  propuestas: Propuesta[]
  /** Si hay dos propuestas, se elige una. */
  eligeUna: boolean
  consejos: string[]
}

export type EntradaConsulta = {
  semana: number
  fases: readonly FaseDieta[]
  fase: FaseDieta | null
  /** Peso medio de cada semana: la 0 es la de antes de empezar; la última, esta. null si no te pesaste. */
  medias: readonly (number | null)[]
  cintura: { ahora: number | null; antes: number | null }
  /** Parte de los días con el plan cumplido (0–1); null sin días que contar. */
  cumplido: number | null
  /** Cambio de la fuerza en tus básicos (−0,03 = un 3 % menos); null sin datos. */
  fuerza: number | null
  revision: Pick<Revision, 'hambre' | 'energia'>
  umbrales: { rapido: number; lento: number }
  pesoKg: number | null
}

/** Semana a partir de la cual se considera fase final (regla 6). */
const FASE_FINAL = 9

const kg = (n: number) => `${n.toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg`

/** Lo que bajaste cada semana (media de la anterior menos la de esa); null si falta una de las dos. */
export function perdidas(medias: readonly (number | null)[]): (number | null)[] {
  return medias
    .slice(1)
    .map((m, i) =>
      m !== null && medias[i] !== null ? Math.round(((medias[i] as number) - m) * 100) / 100 : null,
    )
}

/** Lo que decide el nutricionista, regla a regla (la primera que se cumple manda). */
export function decidir(e: EntradaConsulta): Decision {
  const consejos: string[] = []
  // 8. Hambre alta o energía baja → consejos (van con cualquier decisión)
  if ((e.revision.hambre ?? 0) >= 7 || (e.revision.energia ?? 10) <= 4)
    consejos.push(
      'Más verdura en cada comida y la proteína repartida en 4 tomas.',
      'Los hidratos, antes de entrenar.',
      'Duerme 7–9 horas: el sueño corto da hambre.',
    )
  // Recarga de hidratos según cómo estás, no por calendario (decisión 2026-11-08, guía G1 §7): en la segunda mitad, con
  // hambre alta o energía baja; de varios días, nunca de uno. Las cifras las pone tu nutricionista: la guía no las da.
  if (e.semana >= FASE_FINAL && ((e.revision.hambre ?? 0) >= 7 || (e.revision.energia ?? 10) <= 4))
    consejos.push(
      'Llevas semanas de dieta y lo notas: una recarga de hidratos de varios días (nunca de uno) puede ayudarte. Coméntalo con tu nutricionista.',
    )
  const nada = (titulo: string, detalle: string): Decision => ({
    titulo,
    detalle,
    propuestas: [],
    eligeUna: false,
    consejos,
  })

  // 1. Cambio de fase al llegar a la siguiente del plan
  const siguiente = [...e.fases]
    .sort((a, b) => a.desdeSemana - b.desdeSemana)
    .find((f) => f.desdeSemana > (e.fase?.desdeSemana ?? 0) && f.desdeSemana <= e.semana)
  if (siguiente) {
    const diferencia = siguiente.kcal - (e.fase?.kcal ?? 0)
    return {
      titulo: `Toca la ${siguiente.nombre}`,
      detalle: `Tu dieta pasa a la ${siguiente.nombre} en la semana ${siguiente.desdeSemana}.`,
      propuestas: [
        {
          id: `fase-${siguiente.id}`,
          titulo: `Empezar la ${siguiente.nombre}`,
          detalle: diferencia
            ? `${diferencia > 0 ? '+' : '−'}${Math.abs(diferencia)} kcal al día, en la receta que ajusta de cada menú.`
            : 'Las mismas kcal.',
          cambio: { tipo: 'fase', fase: siguiente.id },
        },
      ],
      eligeUna: false,
      consejos,
    }
  }

  // 2. Semana 1: nada
  if (e.semana <= 1)
    return nada(
      'Semana 1: no se cambia nada',
      'Lo que bajas al principio (1,5–2,5 kg) es agua y glucógeno: aún no dice nada de la grasa.',
    )

  // 3. Plan cumplido por debajo del 60 %
  if (e.cumplido !== null && e.cumplido < 0.6)
    return nada(
      'Primero, cumplir el plan',
      `Cumpliste el ${Math.round(e.cumplido * 100)} % de los días. Con tan pocos no se puede saber si la dieta funciona.`,
    )

  const p = perdidas(e.medias)
  const [antes, ahora] = p.slice(-2)
  const final = e.semana >= FASE_FINAL

  // 4. Dos semanas bajando deprisa, o la fuerza baja un 3 % (fuera de la fase final)
  const deprisa = antes !== null && ahora !== null && antes > e.umbrales.rapido && ahora > e.umbrales.rapido
  if (deprisa || (e.fuerza !== null && e.fuerza <= -0.03 && !final))
    return {
      titulo: deprisa ? 'Dos semanas bajando más deprisa de lo previsto' : 'Tu fuerza en los básicos baja',
      detalle: deprisa
        ? `Has bajado ${kg(antes)} y ${kg(ahora)}: más de ${kg(e.umbrales.rapido)} por semana pierde músculo.`
        : `Un ${Math.round(Math.abs(e.fuerza ?? 0) * 100)} % menos en tus básicos: te falta energía para entrenar.`,
      propuestas: [
        {
          id: 'kcal-mas',
          titulo: '+150 kcal en hidratos',
          detalle: 'Al día, en la receta que ajusta de cada menú (la regla dice de 150 a 200).',
          cambio: { tipo: 'kcal', kcal: { entreno: 150, descanso: 150 } },
        },
      ],
      eligeUna: false,
      consejos,
    }

  // 5. Dos semanas bajando despacio
  const despacio = antes !== null && ahora !== null && antes < e.umbrales.lento && ahora < e.umbrales.lento
  if (despacio) {
    const { ahora: c, antes: c0 } = e.cintura
    if (c !== null && c0 !== null && c0 - c >= 0.5)
      return nada(
        'El peso apenas baja, pero la cintura sí',
        `${(c0 - c).toLocaleString('es-ES', { maximumFractionDigits: 1 })} cm menos de cintura: estás perdiendo grasa. No toques nada.`,
      )
    return {
      titulo: 'Dos semanas bajando despacio',
      detalle: `Menos de ${kg(e.umbrales.lento)} por semana y la cintura igual. Elige una:`,
      propuestas: [
        {
          id: 'pasos-mas',
          titulo: '+2.000 pasos al día',
          detalle: 'Primero, moverte más: no quita comida.',
          cambio: { tipo: 'pasos', pasos: 2000 },
        },
        {
          id: 'kcal-menos',
          titulo: '−100 kcal los días de descanso',
          detalle: 'En la receta que ajusta de cada menú (la regla dice de 100 a 150).',
          cambio: { tipo: 'kcal', kcal: { entreno: 0, descanso: -100 } },
        },
      ],
      eligeUna: true,
      consejos,
    }
  }

  // 6. Fase final y la fuerza baja un 2 % → hidratos, no más proteína (decisión 2026-11-08, guía G1 §6–7: en definición la
  // proteína suficiente, no más; los hidratos son los que te dejan entrenar)
  if (final && e.fuerza !== null && e.fuerza <= -0.02)
    consejos.unshift(
      'Tu fuerza baja al final: no subas la proteína, pon los hidratos alrededor del entreno. Si además tienes hambre o duermes peor, habla con tu nutricionista de una recarga de hidratos de varios días.',
    )

  if (antes === null || ahora === null)
    return nada(
      'Aún no puedo comparar semanas',
      'Necesito dos semanas seguidas con pesajes para ver tu ritmo. Pésate cada mañana.',
    )

  // 7. Una sola semana fuera → esperar
  const fuera = (x: number) => x > e.umbrales.rapido || x < e.umbrales.lento
  if (fuera(ahora))
    return nada(
      'Una semana fuera de lo previsto: esperamos',
      `Has bajado ${kg(ahora)}. Una sola semana no basta: si se repite, te propongo un cambio.`,
    )

  return nada('Vas como esperaba', `Has bajado ${kg(ahora)} esta semana. No cambies nada.`)
}

/** Las señales de mala recuperación que se ven en la consulta (sección 5). */
export function senales(r: Pick<Revision, 'sueno' | 'fatiga' | 'energia' | 'dolor' | 'ganas'>): string[] {
  const s: string[] = []
  if (r.sueno !== null && r.sueno < 6) s.push(`duermes ${r.sueno.toLocaleString('es-ES')} h`)
  if ((r.fatiga !== null && r.fatiga >= 7) || (r.energia !== null && r.energia <= 4))
    s.push(
      r.fatiga !== null && r.fatiga >= 7
        ? `la fatiga está en ${r.fatiga}`
        : `la energía está en ${r.energia}`,
    )
  if (r.dolor !== null && r.dolor >= 6) s.push(`el dolor articular está en ${r.dolor}`)
  if (r.ganas !== null && r.ganas <= 3) s.push(`las ganas de entrenar están en ${r.ganas}`)
  return s
}

/** Peso medio de cada semana de la dieta (la 0, la de antes de empezar) hasta la de `hoy`. */
export function mediasSemanales(
  pesajes: readonly Pesaje[],
  inicio: string,
  semanas: number,
): (number | null)[] {
  return Array.from({ length: semanas + 1 }, (_, k) => {
    const desde = addDays(inicio, (k - 1) * 7)
    const hasta = addDays(desde, 6)
    const de = pesajes.filter((p) => p.date >= desde && p.date <= hasta).map((p) => p.kg)
    return de.length ? Math.round((de.reduce((s, x) => s + x, 0) / de.length) * 100) / 100 : null
  })
}

/**
 * ¿Cumpliste el plan un día? Sí con 3 de cada 4 recetas apuntadas, o si las kcal quedan a ±10 % y la proteína llega al
 * 90 % (regla del prototipo, `dayAdherence`).
 */
export function diaCumplido(
  recetas: readonly string[],
  apuntes: readonly Apunte[],
  total: Macros,
  objetivo: Macros,
): boolean {
  const hechas = recetas.filter((id) => apuntes.some((a) => a.receta === id)).length
  if (recetas.length && hechas / recetas.length >= 0.75) return true
  return (
    total.kcal > 0 &&
    Math.abs(total.kcal - objetivo.kcal) <= objetivo.kcal * 0.1 &&
    total.protein >= objetivo.protein * 0.9
  )
}
