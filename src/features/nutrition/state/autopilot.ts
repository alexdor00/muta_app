// Lo que se ve de tu semana resuelta: tus tandas (de hace una semana a dentro de dos), lo de hoy (la tanda y tus tápers), la
// tanda que no hiciste, tu próxima compra con lo que falta. Lo carga y guarda
// use-cases/autopilot.ts; aquí no se guarda nada.
import { computed } from '@preact/signals'
import { addDays } from '../../../shared/lib/format.ts'
import {
  compraQueToca,
  fechasDeCompra,
  esFresco,
  esProteina,
  fechasDeTandas,
  preparacion,
  platosDeTanda,
  huecosDeLaCompra,
  tandaDeHueco,
  tandaPerdida as perdidaDe,
  tandasDe,
  type Piloto,
  type Preparar,
  type Tanda,
} from '../domain/autopilot.ts'
import {
  clave,
  huecoDe,
  huecosDelDia,
  menuDelDia,
  semanaDesde,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import { pasanDeLaNevera, recetasDeHuecos } from '../domain/menuCocina.ts'
import { extrasDeDias } from '../domain/menuExtras.ts'
import { porPersonas } from '../domain/menuPlan.ts'
import { listaDeLaCompra, porComprar } from '../domain/shopping.ts'
import { hoy, tipoDe, type ComidaId } from './comida.ts'
import { compra } from './dieta.ts'
import { enCrudoDe, gramosDeHueco, menu, personas, platoPorId, totalCon } from './recetas.ts'

export {
  esFresco,
  esProteina,
  horaDe,
  partesDeTanda,
  PREPARAR,
  preparacion,
  tandaDeHueco,
  HORA_COCINA,
  HORA_COMPRA,
  paraQueDias,
  soloDeUnPlato,
  pilotoNuevo,
  platosDeTanda,
} from '../domain/autopilot.ts'
export type { ModoCocina, Partes, Piloto, Preparar, Tanda } from '../domain/autopilot.ts'
export type { PorComprar } from '../domain/shopping.ts'

/** Tu semana resuelta (null: sin piloto). */
export const piloto = computed(() => menu.value.piloto)

const esDescanso = (f: string) => tipoDe(f) === 'descanso'

/**
 * ¿Se hace el mismo día este ingrediente de un plato (con una parte al momento)? Lo que elegiste en ese plato o, sin
 * elegir, su proteína.
 */
export const fresco = (plato: string, i: { nombre: string; macro: string | null }) =>
  piloto.value ? esFresco(piloto.value, plato, i) : esProteina(i)

/** Hasta dónde se calculan las tandas: tres semanas, para que la última que se ve sepa hasta dónde llega. */
const HORIZONTE = 21

/**
 * Las tandas con un piloto (el tuyo o el de la hoja, antes de aplicarlo) y un menú (el tuyo o el de la hoja, con sus días
 * por menú), de hace una semana a dentro de dos.
 */
export function tandasCon(p: Piloto | null, m: MenuSemanal = menu.value): Tanda[] {
  if (!p) return []
  const h = hoy.value
  const fechas = fechasDeTandas(p, addDays(h, HORIZONTE), esDescanso, m)
  return tandasDe(m, p, fechas).filter((t) => t.fecha >= addDays(h, -7) && t.fecha <= addDays(h, 14))
}

/** Tus días de cocina con algo que cocinar (para la compra que va con ellos). */
const diasConTanda = (ts: readonly Tanda[]) => ts.filter((t) => t.huecos.length).map((t) => t.fecha)

/** Los días de compra entre unas fechas, con tu piloto (el tuyo o el de la hoja) y sus tandas. */
export const diasDeCompra = (p: Piloto, fechas: readonly string[], ts: readonly Tanda[]) =>
  fechasDeCompra(p, fechas, diasConTanda(ts))

/** Los días de tus tandas que ya pasaron (para dejarlos fijos). */
export function tandasPasadas(p: Piloto): string[] {
  return fechasDeTandas(p, addDays(hoy.value, HORIZONTE), esDescanso, menu.value).filter((f) => f < hoy.value)
}

export const tandas = computed(() => tandasCon(piloto.value))

export const tandaDeHoy = computed(() => tandas.value.find((t) => t.fecha === hoy.value) ?? null)

/** Tu próxima tanda sin hacer (hoy o después). */
export const siguienteTanda = computed(
  () => tandas.value.find((t) => t.fecha >= hoy.value && !t.hecha && t.huecos.length) ?? null,
)

/** La tanda que no hiciste y aún te da de comer (se propone pasarla a hoy). */
export const tandaPerdida = computed(() => {
  const p = piloto.value
  return p ? perdidaDe(p, tandas.value, hoy.value) : null
})

export type Taper = { hueco: Hueco; tanda: Tanda }

/** Tus tápers de un día: cada comida que sale de una tanda. */
export function taperesDe(fecha: string): Taper[] {
  return tandas.value.flatMap((t) =>
    t.huecos.filter((h) => h.fecha === fecha).map((h) => ({ hueco: h, tanda: t })),
  )
}

/**
 * Lo que cocinas aparte un día a una hora, como una tanda (para el modo cocina): sus comidas (sin las que pasan de 3 días
 * en la nevera: esas, al momento) y si ya lo cocinaste. null si no hay nada.
 */
export function aparteComoTanda(fecha: string, hora: string): { tanda: Tanda; ids: string[] } | null {
  const sesion = menu.value.cocinados.filter((c) => c.fecha === fecha && c.hora === hora)
  if (!sesion.length) return null
  const para = sesion.flatMap((c) => c.para)
  const huecos = [...new Set(para)].sort().flatMap((k) => {
    const [f, comida] = k.split('|')
    return huecosDelDia(menu.value, f).filter((h) => h.comida === comida)
  })
  const fuera = pasanDeLaNevera(fecha, para)
  return {
    tanda: {
      fecha,
      hora,
      huecos: huecos.filter((h) => !fuera.includes(clave(h.fecha, h.comida))),
      mixtos: [],
      candidatos: [],
      hecha: sesion.every((c) => c.hecho),
    },
    ids: sesion.map((c) => c.id),
  }
}

/** Una comida para cocinarla ahora: con tu semana resuelta, cómo va (al momento o solo su proteína); si no, al momento. */
export function comidaParaCocinar(fecha: string, comida: string): ComidaDeHoy | null {
  const c = comidasDelDia(fecha).find((x) => x.hueco.comida === comida)
  if (c) return c
  const h = huecosDelDia(menu.value, fecha).find((x) => x.comida === comida)
  return h ? { hueco: h, como: 'momento', tanda: null } : null
}

const mismo = (a: Hueco, b: Hueco) => a.fecha === b.fecha && a.comida === b.comida

/** Cómo es una comida de hoy con tu semana resuelta: de un táper, de un táper con la proteína al momento o al momento. */
export type ComidaDeHoy = { hueco: Hueco; como: Preparar; tanda: Tanda | null }

/** Tus comidas de un día con tu semana resuelta (sin piloto o sin tandas, ninguna). */
export function comidasDelDia(fecha: string): ComidaDeHoy[] {
  const p = piloto.value
  if (!p || p.cocina.modo === 'no') return []
  return huecosDelDia(menu.value, fecha).flatMap((h) => {
    if (h.cocinado) return []
    const t = tandaDeHueco(tandas.value, h)
    // Lo que no cubre ninguna tanda (antes de la primera) se hace al momento
    const como: Preparar = t ? preparacion(p, h) : 'momento'
    return [{ hueco: h, como, tanda: t }]
  })
}

/**
 * Tu próxima compra (la de hoy si es tu día): lo que falta con lo que tienes en casa, lo que ya tienes y lo que compraste
 * para ella. null sin día de compra.
 */
export const compraDeLaSemana = computed(() => {
  const p = piloto.value
  const conTanda = diasConTanda(tandas.value)
  const fecha = p ? compraQueToca(p, hoy.value, conTanda) : null
  if (!p?.compra || !fecha) return null
  // Con la compra el día que cocinas, cada compra llega hasta la siguiente; si no, una semana
  const siguiente = p.compra.conCocina
    ? conTanda.find((f) => f > fecha)
    : addDays(fecha, 7 * Math.max(1, p.compra.semanas ?? 1))
  const huecos = huecosDeLaCompra(menu.value, tandas.value, fecha, siguiente)
  // Para todos los que coméis (usuario, 2026-11-18: «cocinas para N personas»)
  const recetas = porPersonas(
    [
      ...recetasDeHuecos(menu.value, huecos, (id) => platoPorId(id), gramosDeHueco),
      ...extrasDeDias(menu.value, semanaDesde(fecha), (id) => platoPorId(id)),
    ],
    personas.value,
  )
  // Las raciones de más de cada día de cocina de esta compra (para alguien que come «a voleo»)
  for (const t of tandas.value) {
    if (t.fecha < fecha || (siguiente && t.fecha >= siguiente)) continue
    for (const x of platosDeTanda(t)) {
      const e = deMasDe(t, x.plato)
      if (!e) continue
      const suyos = t.huecos.filter((h) => h.plato === x.plato)
      recetas.push(
        ...porPersonas(
          recetasDeHuecos(menu.value, suyos, (id) => platoPorId(id), gramosDeHueco),
          (personas.value * e) / suyos.length,
        ),
      )
    }
  }
  // Los platos que cubre (para las fotos de la tarjeta de Tu día)
  const platosDeCompra = [...new Set(huecos.map((h) => h.plato))]
  const c = compra.value
  const compradas = c?.semanaDe === fecha ? (c.compradas ?? {}) : {}
  const productos = listaDeLaCompra([{ recetas }], c?.extra ?? {})
  return {
    fecha,
    hora: p.compra.hora,
    compradas,
    platos: platosDeCompra,
    hasta: siguiente ?? addDays(fecha, 7),
    // Cuántos días de cada menú cubre (usuario, 2026-11-19: «a cuántos menús pertenece»)
    menus: diasDeCadaMenu(fecha, siguiente ?? addDays(fecha, 7)),
    faltan: porComprar(productos, compradas),
  }
})

/** Lo que tardas en una tanda (sugerido): lo que dicen sus recetas, una detrás de otra; null si no lo dicen. */
export function minutosDeTanda(t: Tanda): number | null {
  const m = platosDeTanda(t).reduce((s, x) => s + (platoPorId(x.plato)?.minutos ?? 0), 0)
  return m || null
}

/**
 * Los gramos de un plato en una comida de la tanda: los de tu menú o, en una receta suelta, los del libro (casi siempre
 * una ración; las que traen varias, como la granola, se cocinan enteras y lo que aporta se da por ración).
 */
export function gramosDe(
  t: Tanda,
  h: Hueco,
  p: NonNullable<ReturnType<typeof platoPorId>>,
): (number | null)[] {
  return t.libro ? p.ingredientes.map((i) => i.gramos) : gramosDeHueco(h, p)
}

/** Lo que aporta una ración de un plato de la tanda (la de esa comida, o la del libro). */
export function racionEnTanda(t: Tanda, h: Hueco) {
  const p = platoPorId(h.plato, h.fecha)
  return p ? totalCon(p, gramosDe(t, h, p)) : null
}

/** Lo que cocinas de un plato en una tanda: cada ingrediente con los gramos de todas sus comidas. */
export function paraCocinarEnTanda(t: Tanda, platoId: string) {
  const p = platoPorId(platoId)
  if (!p) return []
  // En los tápers con la proteína al momento, la tanda no la cocina
  const gramos = (h: Hueco, x: typeof p) =>
    gramosDe(t, h, x).map((g, k) =>
      t.mixtos.some((y) => mismo(y, h)) && fresco(platoId, x.ingredientes[k]) ? 0 : g,
    )
  // Con los huecos de la tanda tal cual (un plato suelto de Cocinar no está en tu menú ese día): para todos, la olla entera
  const gs = t.huecos.filter((h) => h.plato === platoId).map((h) => gramos(h, p))
  return p.ingredientes
    .map((i, k) => ({
      nombre: i.nombre,
      alimentoId: i.alimentoId,
      categoria: i.categoria,
      texto: i.texto,
      macro: i.macro,
      gramos:
        i.gramos === null || !i.cuenta
          ? null
          : Math.round(gs.reduce((a, g) => a + (g[k] ?? i.gramos ?? 0), 0)),
    }))
    .filter((i) => i.gramos !== 0)
    .map((i) => ({ ...i, gramos: i.gramos === null ? null : Math.round(i.gramos * factorOlla(t, platoId)) }))
}

/**
 * Los gramos de lo que va a la olla en una comida (usuario, 2026-11-21: al pesar lo cocinado): con la proteína al momento
 * («la base»), lo fresco a 0.
 */
export function gramosEnOlla(t: Tanda, h: Hueco): (number | null)[] {
  const p = platoPorId(h.plato, h.fecha)
  if (!p) return []
  const mixto = t.mixtos.some((y) => mismo(y, h))
  return gramosDe(t, h, p).map((x, k) => (mixto && fresco(h.plato, p.ingredientes[k]) ? 0 : x))
}

/** «Pollo con arroz ×4 · Salmón con patata ×3 (la base)»: «la base» si su proteína se hace al momento. */
export const platosEnTexto = (t: Tanda) =>
  platosDeTanda(t)
    .map((x) => {
      const base = t.mixtos.some((h) => h.plato === x.plato) ? ' (la base)' : ''
      return `${platoPorId(x.plato)?.nombre ?? 'Plato'} ×${x.raciones}${base}`
    })
    .join(' · ')

/** «salmón, pepino, tomate y aguacate». */
export const enLista = (xs: readonly string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : (xs[0] ?? '')

/** Las raciones de más de un plato en un día de cocina (para alguien que come «a voleo»). */
export const deMasDe = (t: Tanda, plato: string) => piloto.value?.deMas?.[`${t.fecha}|${plato}`] ?? 0

/**
 * Cuánto crece la olla de un plato: por las personas para las que cocinas y por sus raciones de más (con 2 tuyas y 1 de
 * más, ×1,5). Al repartir se divide por lo mismo y tus tápers cuadran con tu menú.
 */
export function factorOlla(t: Tanda, plato: string): number {
  const n = t.huecos.filter((h) => h.plato === plato).length
  return personas.value * (n ? (n + deMasDe(t, plato)) / n : 1)
}

/** Cuántos días de cada menú hay entre dos fechas (sin los libres), en el orden de tus menús. */
function diasDeCadaMenu(desde: string, hasta: string): { id: string; dias: number }[] {
  const m = menu.value
  const n = new Map<string, number>()
  for (let f = desde; f < hasta; f = addDays(f, 1)) {
    if (m.libres?.includes(f)) continue
    const x = menuDelDia(m, f)
    if (x) n.set(x.id, (n.get(x.id) ?? 0) + 1)
  }
  return m.menus.filter((x) => n.has(x.id)).map((x) => ({ id: x.id, dias: n.get(x.id)! }))
}

/**
 * Un plato de tus menús para cocinarlo ahora en el modo cocina (usuario, 2026-11-22: desde Cocinar, como una tanda de una
 * comida): con los gramos del próximo día con ese menú y esa comida (si no hay, tu ración de esa comida hoy). Sin menú
 * (desde una receta), la ración del recetario.
 */
export function platoComoTanda(plato: string, menuId: string, comida: ComidaId): Tanda {
  const m = menu.value
  // Sin menú, la receta tal cual: la ración del recetario
  if (!menuId)
    return {
      fecha: hoy.value,
      hora: '',
      huecos: [{ fecha: hoy.value, comida, menu: '', plato, cocinado: null }],
      mixtos: [],
      candidatos: [],
      hecha: false,
      libro: true,
    }
  const dias = Array.from({ length: 28 }, (_, k) => addDays(hoy.value, k))
  const f = dias.find((x) => menuDelDia(m, x)?.id === menuId && huecoDe(m, x, comida)?.plato === plato)
  const hueco = (f && huecoDe(m, f, comida)) || {
    fecha: hoy.value,
    comida,
    menu: menuId,
    plato,
    cocinado: null,
  }
  return { fecha: hoy.value, hora: '', huecos: [hueco], mixtos: [], candidatos: [], hecha: false }
}

/** Si un plato lleva algo que se cuece (cambia de peso al cocinarlo): entonces se puede pesar lo cocinado. */
export const llevaAlgoQueSeCuece = (plato: string) =>
  (platoPorId(plato)?.ingredientes ?? []).some(
    (i) => i.cuenta && i.gramos && enCrudoDe(i.alimentoId, i.gramos),
  )
