// Tu semana, resuelta: el piloto automático de la compra y la cocina. Tú eliges el día de la compra, cómo cocinas (en tus
// días de descanso —los de tu rutina, que cambian con ella—, en los días que elijas o sin tandas) y qué comidas van en
// táper. De aquí salen tus tandas (qué cocinas cada día y para qué comidas; lo cocinado aguanta 3 días en la
// nevera, DIAS_NEVERA, y lo que caería más tarde se hace al momento) y lo que pide cada compra hasta la siguiente. Todo es una propuesta: lo aplicas tú.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import type { ComidaId } from './food.ts'
import { clave, diaSemana, huecosDelDia, NOMBRE_DIA, type Hueco, type MenuSemanal } from './menu.ts'
import { DIAS_NEVERA } from './menuCocina.ts'
import { horaDeComida } from './menuPlan.ts'
import { MAX_DIAS, porBloques, vispera } from './diasDeCocina.ts'
export { fechasDeTandas, porDescanso, porDias, porMenu, porVeces } from './diasDeCocina.ts'

/**
 * Cómo cocinas: al empezar cada menú (el primer día de cada menú, para todos sus días; como «Cuándo cocinar» de una
 * dieta), en tus descansos, los días que elijas o cada día (sin tandas).
 */
export type ModoCocina = 'veces' | 'dieta' | 'menu' | 'descanso' | 'dias' | 'no'

/**
 * Cómo preparas una comida: en táper (de tu tanda), en táper con la proteína recién hecha (la tanda hace la base: arroz,
 * legumbre, verdura…) o al momento (la cocinas justo antes: puedes cocinar varias veces al día).
 */
export type Preparar = 'taper' | 'mixto' | 'momento'
// 'mixto': una parte al momento (de serie la proteína; en cada plato, lo que elijas: la verdura, el arroz…)

export type Piloto = {
  /**
   * El día de la semana de la compra (0 = lunes) y su hora; con `conCocina`, el día que cocinas (cada compra, lo de esa
   * tanda hasta la siguiente). null: sin día fijo. Lo eliges tú.
   */
  /** Tu compra: su día y su hora; `semanas`, cada cuántas (1, 2 o 4; usuario, 2026-11-19), contando desde `desde`. */
  compra: { dia: number; hora: string; conCocina?: boolean; semanas?: number } | null
  /**
   * Cómo cocinas: en tus días de descanso (MUTA elige entre los de tu rutina los justos), en los días de la semana que
   * elijas (`dias`, 0 = lunes) o sin tandas. A la misma hora.
   */
  cocina: { modo: ModoCocina; dias: number[]; hora: string; veces?: number }
  /** Los días que añadiste a mano en el calendario (cocinas aunque tu regla no lo diga). */
  anadidas: string[]
  /** Cómo preparas cada comida (la que no está, al momento). */
  preparar: Partial<Record<ComidaId, Preparar>>
  /** Los platos que van distinto de su comida (su id → cómo). */
  porPlato: Record<string, Preparar>
  /**
   * Con una parte al momento: lo que haces el mismo día de cada plato (su id → los nombres de sus ingredientes). Sin
   * elegir, la proteína (`esProteina`).
   */
  frescos: Record<string, string[]>
  /** Los días que ya cocinaste (o tocaba): quedan fijos; los que vienen se calculan con tu regla. */
  tandas: string[]
  /** Las tandas que no van (las pasaste a otro día). */
  saltadas: string[]
  /** Las tandas hechas (su día). */
  hechas: string[]
  /** Las tandas que no hiciste y a las que dijiste «Ahora no» al pasarlas a hoy. */
  descartadas: string[]
  /**
   * Lo que marcas en un día de cocina (usuario, 2026-11-16: una sola idea, «tus días de cocina»): cada comida (`fecha|comida`)
   * que dejas hecha (true) o que cocinas el mismo día (false). Sin marcar, lo de su comida o su plato.
   */
  marcadas: Record<string, boolean>
  /** La hora de cada día de cocina (su fecha → «20:30»), si no es la de siempre (usuario, 2026-11-16). */
  horas: Record<string, string>
  /**
   * Raciones de más de un plato en un día de cocina (`fecha|plato` → cuántas), para alguien que come «a voleo»
   * (usuario, 2026-11-19): la olla y la compra crecen; al repartir, tus tápers siguen cuadrando con tu menú.
   */
  deMas?: Record<string, number>
  /** Desde cuándo va así. */
  desde: string
}

/**
 * Lo que viene marcado al empezar (sugerido): el desayuno y la merienda al momento; la comida y la cena en táper; cocinar
 * a las 19:00 y comprar a las 11:00.
 */
export const PREPARAR: Record<ComidaId, Preparar> = {
  desayuno: 'momento',
  comida: 'taper',
  merienda: 'momento',
  cena: 'taper',
}
export const HORA_COCINA = '19:00'
export const HORA_COMPRA = '11:00'

export function pilotoNuevo(hoy: string): Piloto {
  return {
    compra: null,
    cocina: { modo: 'descanso', dias: [], hora: HORA_COCINA },
    preparar: { ...PREPARAR },
    anadidas: [],
    porPlato: {},
    frescos: {},
    tandas: [],
    saltadas: [],
    hechas: [],
    descartadas: [],
    marcadas: {},
    horas: {},
    desde: hoy,
  }
}

/** Lo guardado antes (`comidas`: las que iban en táper) o, si no hay, lo de serie. */
function deAntes(x: object): Partial<Record<ComidaId, Preparar>> {
  const comidas = (x as { comidas?: unknown }).comidas
  if (!Array.isArray(comidas)) return { ...PREPARAR }
  return Object.fromEntries(
    (Object.keys(PREPARAR) as ComidaId[]).map((c) => [c, comidas.includes(c) ? 'taper' : 'momento']),
  )
}

/** Cómo se prepara una comida: lo de su plato, si va distinto; si no, lo de su comida (sin decir, al momento). */
export const preparacion = (p: Piloto, h: Hueco): Preparar =>
  p.porPlato[h.plato] ?? p.preparar[h.comida] ?? 'momento'

/**
 * ¿Es la proteína de un plato (lo que se hace al momento con «táper + carne al momento»)? La que la receta da como macro
 * principal: la carne, el pescado, los huevos…
 */
export const esProteina = (i: { macro: string | null }) => i.macro === 'protein'

/**
 * La verdura que se come cruda y conviene cortar el mismo día (usuario, 2026-11-16: «sobre todo aguacates y hortalizas»).
 * Sugerido: de los ingredientes del recetario, los que van crudos; el tomate, la cebolla o el pimiento no, porque en la
 * mayoría de recetas van cocinados. En cada plato se cambia.
 */
export const VERDURA_FRESCA: ReadonlySet<string> = new Set([
  'Aguacate',
  'Tomate cherry',
  'Pepino',
  'Lechuga',
  'Lechuga hoja de roble',
  'Rúcula',
  'Rábanos',
  'Cebolleta',
  'Apio',
])

/**
 * ¿Este ingrediente de un plato se hace el mismo día (con una parte al momento)? Lo que dice tu dieta cargada para ese plato o, sin
 * elegir, su proteína y la verdura fresca.
 */
export function esFresco(p: Piloto, plato: string, i: { nombre: string; macro: string | null }): boolean {
  const elegidos = p.frescos[plato]
  return elegidos ? elegidos.includes(i.nombre) : esProteina(i) || VERDURA_FRESCA.has(i.nombre)
}

/** Lo guardado sin alguna parte (o de otra forma) se completa con lo de serie. */
export function leerPiloto(x: unknown): Piloto | null {
  if (!x || typeof x !== 'object') return null
  const p = x as Partial<Piloto>
  const base = pilotoNuevo(typeof p.desde === 'string' ? p.desde : '2026-01-01')
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [])
  return {
    ...base,
    compra: p.compra && typeof p.compra.dia === 'number' ? p.compra : null,
    cocina: p.cocina && typeof p.cocina.modo === 'string' ? { ...base.cocina, ...p.cocina } : base.cocina,
    preparar: p.preparar && typeof p.preparar === 'object' ? p.preparar : deAntes(x),
    porPlato: p.porPlato && typeof p.porPlato === 'object' ? p.porPlato : {},
    frescos: p.frescos && typeof p.frescos === 'object' ? p.frescos : {},
    tandas: lista(p.tandas),
    saltadas: lista(p.saltadas),
    anadidas: lista(p.anadidas),
    hechas: lista(p.hechas),
    descartadas: lista(p.descartadas),
    // Ya no se marca cada día aparte (usuario, 2026-11-21): lo guardado de antes no cuenta
    marcadas: {},
    horas:
      p.horas && typeof p.horas === 'object'
        ? Object.fromEntries(Object.entries(p.horas).filter(([, v]) => typeof v === 'string'))
        : {},
    deMas:
      p.deMas && typeof p.deMas === 'object'
        ? Object.fromEntries(Object.entries(p.deMas).filter(([, v]) => typeof v === 'number' && v > 0))
        : {},
  }
}

// --- Qué cubre cada tanda ---

export type Tanda = {
  fecha: string
  hora: string
  /** Las comidas en táper desde que cocinas hasta la tanda siguiente (en orden). */
  huecos: Hueco[]
  /** Todas las comidas de esos días que podrías dejar hechas (las que marcas en el día de cocina). */
  candidatos: Hueco[]
  /** De esas, las de solo la base: su proteína se hace al momento. */
  mixtos: Hueco[]
  hecha: boolean
  /** Una receta suelta, sin menú (usuario, 2026-11-22): con la ración del recetario, no ajustada a una comida. */
  libro?: boolean
}

const momento = (fecha: string, hora: string) => `${fecha}T${hora}`

/**
 * Lo que cubre cada tanda: las comidas en táper (con su proteína o solo la base; sin las que cocinas aparte) desde la hora de cocinar hasta la
 * siguiente tanda (la última, sus 3 días de nevera). Nada pasa de 3 días en la nevera: lo que caería más tarde se hace al
 * momento ese día (sin congelador; usuario, 2026-11-18).
 */
export function tandasDe(m: MenuSemanal, p: Piloto, fechas: readonly string[]): Tanda[] {
  // Por bloques de menú, cada tanda cubre días enteros: si cocinas después de comer (la tarde de antes), desde el día
  // siguiente; si no, desde ese mismo día (antes de su primera comida). Hasta el bloque de la siguiente tanda.
  const diasEnteros = porBloques(p)
  const salto = diasEnteros && vispera(p) ? 1 : 0
  return fechas.map((c, i) => {
    const f = addDays(c, salto)
    const inicio = diasEnteros ? momento(f, '00:00') : momento(c, horaDe(p, c))
    const siguiente = fechas[i + 1]
    const fin = siguiente
      ? diasEnteros
        ? momento(addDays(siguiente, salto - 1), '23:59')
        : momento(siguiente, horaDe(p, siguiente))
      : momento(addDays(f, diasEnteros ? DIAS_NEVERA - 1 : DIAS_NEVERA), '23:59')
    const desdeDia = diasEnteros ? f : c
    const dias = daysBetween(desdeDia, fin.slice(0, 10))
    const candidatos = Array.from({ length: dias + 1 }, (_, k) => addDays(desdeDia, k)).flatMap((d) =>
      huecosDelDia(m, d).filter((h) => {
        if (h.cocinado || daysBetween(c, h.fecha) > DIAS_NEVERA) return false
        const cuando = momento(h.fecha, horaDeComida(m, h.comida))
        return cuando > inicio && cuando <= fin
      }),
    )
    // Lo de su comida en «Cómo cocinas» (usuario, 2026-11-21: sin marcar cada día aparte)
    const huecos = candidatos.filter((h) => preparacion(p, h) !== 'momento')
    return {
      fecha: c,
      hora: horaDe(p, c),
      huecos,
      candidatos,
      mixtos: huecos.filter((h) => preparacion(p, h) === 'mixto'),
      hecha: p.hechas.includes(c),
    }
  })
}

/** La hora de un día de cocina: la suya o, si no tiene, la de siempre. */
export const horaDe = (p: Piloto, fecha: string) => p.horas[fecha] ?? p.cocina.hora

/** Lo que se cocina de un plato el día de cocina y lo que se hace el día que comes. */
export type Partes = { plato: string; raciones: number; ahora: string[]; luego: string[] }

/**
 * Cada plato de un día de cocina con sus raciones y sus partes (usuario, 2026-11-16: «cuándo se cocina cada plato y qué
 * parte»): los ingredientes que cuentan, los que van al momento (`esFresco`) si alguna de sus comidas va con una parte al
 * momento, y el resto ese día.
 */
export function partesDeTanda(
  t: Tanda,
  p: Piloto,
  platoDe: (
    id: string,
  ) => { ingredientes: { nombre: string; macro: string | null; cuenta: boolean }[] } | null,
): Partes[] {
  return platosDeTanda(t).map(({ plato, raciones }) => {
    const ingredientes = (platoDe(plato)?.ingredientes ?? []).filter((i) => i.cuenta)
    const conParte = t.mixtos.some((h) => h.plato === plato)
    const luego = conParte ? ingredientes.filter((i) => esFresco(p, plato, i)).map((i) => i.nombre) : []
    const ahora = ingredientes.map((i) => i.nombre).filter((n) => !luego.includes(n))
    return { plato, raciones, ahora, luego }
  })
}

/** Los platos de una tanda con sus raciones, en el orden en que se comen. */
export function platosDeTanda(t: Tanda): { plato: string; raciones: number }[] {
  const n = new Map<string, number>()
  for (const h of t.huecos) n.set(h.plato, (n.get(h.plato) ?? 0) + 1)
  return [...n].map(([plato, raciones]) => ({ plato, raciones }))
}

/** La misma tanda con un solo plato (cocinar solo esa receta; usuario, 2026-11-17). */
export function soloDeUnPlato(t: Tanda, plato: string): Tanda {
  const de = (hs: readonly Hueco[]) => hs.filter((h) => h.plato === plato)
  return {
    ...t,
    huecos: de(t.huecos),
    candidatos: de(t.candidatos),
    mixtos: de(t.mixtos),
  }
}

/** «para lun–mié» (o «para el jue»): de qué día a qué día comes de esta tanda. */
export function paraQueDias(t: Tanda): string {
  const primero = t.huecos[0]?.fecha
  const ultimo = t.huecos.at(-1)?.fecha
  if (!primero || !ultimo) return 'sin tápers'
  const n = (f: string) => NOMBRE_DIA[diaSemana(f)].toLowerCase()
  return primero === ultimo ? `para el ${n(primero)}` : `para ${n(primero)}–${n(ultimo)}`
}

/** La tanda que cubre una comida (null si se prepara al momento). */
export function tandaDeHueco(tandas: readonly Tanda[], h: Hueco): Tanda | null {
  const k = clave(h.fecha, h.comida)
  return tandas.find((t) => t.huecos.some((x) => clave(x.fecha, x.comida) === k)) ?? null
}

/**
 * La tanda que no hiciste y aún te da de comer (la más reciente de antes de hoy, sin hacer, sin «Ahora no» y con comidas
 * de hoy en adelante): para proponerte pasarla a hoy. null si no hay.
 */
export function tandaPerdida(p: Piloto, tandas: readonly Tanda[], hoy: string): Tanda | null {
  const perdidas = tandas.filter(
    (t) =>
      t.fecha < hoy &&
      !t.hecha &&
      !p.hechas.includes(t.fecha) &&
      !p.descartadas.includes(t.fecha) &&
      t.huecos.some((h) => h.fecha >= hoy),
  )
  return perdidas.at(-1) ?? null
}

// --- La compra ---

/** Tu próxima compra: hoy si es tu día; si no, la siguiente (null sin día fijo). Con `conCocina`, tu próximo día de cocina. */
export function compraQueToca(p: Piloto, hoy: string, diasDeCocina: readonly string[] = []): string | null {
  if (!p.compra) return null
  if (p.compra.conCocina) return diasDeCocina.find((f) => f >= hoy) ?? null
  const n = Math.max(1, p.compra.semanas ?? 1)
  return (
    Array.from({ length: 7 * n }, (_, i) => addDays(hoy, i)).find(
      (f) => diaSemana(f) === p.compra!.dia && tocaSemana(p, f),
    ) ?? null
  )
}

/** Con compra cada 2 o 4 semanas: si esa fecha cae en una semana de compra (contando desde que empezó tu plan). */
const tocaSemana = (p: Piloto, f: string) => {
  const n = Math.max(1, p.compra?.semanas ?? 1)
  return n === 1 || Math.floor(daysBetween(p.desde, f) / 7) % n === 0
}

/** Los días de compra entre unas fechas (los de tu día fijo o, con `conCocina`, tus días de cocina). */
export function fechasDeCompra(
  p: Piloto,
  fechas: readonly string[],
  diasDeCocina: readonly string[],
): string[] {
  if (!p.compra) return []
  if (p.compra.conCocina) return fechas.filter((f) => diasDeCocina.includes(f))
  return fechas.filter((f) => diaSemana(f) === p.compra!.dia && tocaSemana(p, f))
}

/**
 * Lo que pide la compra de un día hasta la siguiente (una semana): lo de las tandas que cocinas esos días (aunque se coma
 * después) y lo que se prepara al momento esos días. Lo de una tanda de antes ya se compró.
 */
export function huecosDeLaCompra(
  m: MenuSemanal,
  tandas: readonly Tanda[],
  fecha: string,
  hasta: string = addDays(fecha, MAX_DIAS),
): Hueco[] {
  const fin = hasta
  const enTanda = new Set(tandas.flatMap((t) => t.huecos.map((h) => clave(h.fecha, h.comida))))
  const deTandas = tandas.filter((t) => t.fecha >= fecha && t.fecha < fin).flatMap((t) => t.huecos)
  const alMomento = Array.from({ length: Math.max(1, daysBetween(fecha, fin)) }, (_, i) => addDays(fecha, i))
    .flatMap((d) => huecosDelDia(m, d))
    .filter((h) => !enTanda.has(clave(h.fecha, h.comida)))
  return [...deTandas, ...alMomento]
}
