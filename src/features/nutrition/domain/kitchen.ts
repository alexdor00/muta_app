// Cocina: cuánto arroz cocer y cuánto pesa cocido, repartir una olla en raciones y calcular un plato propio por 100 g.
// Reglas del prototipo anterior (js/comida/dieta.js · cocina y js/comida/calculadora-platos.js).
import { sumar, type Alimento, type Macros } from './food.ts'
import type { RecetaDelDia } from './diet.ts'

/** El arroz de unas recetas: lo que llevan en crudo, cada una con su peso cocido según tu factor. */
export function arrozDe(
  recetas: readonly RecetaDelDia[],
  factor: number,
): { crudo: number; recetas: { nombre: string; crudo: number; cocido: number }[] } {
  const filas = recetas.flatMap((r) =>
    r.lista
      .filter((i) => /arroz/i.test(i.nombre) && i.g && !/tortita|bebida|harina|inflad/i.test(i.nombre))
      .map((i) => ({ nombre: r.nombre, crudo: i.g ?? 0, cocido: Math.round((i.g ?? 0) * factor) })),
  )
  return { crudo: filas.reduce((s, f) => s + f.crudo, 0), recetas: filas }
}

/** Tu factor del arroz: lo que pesa cocido entre lo que pesaba en crudo (null si falta un peso). */
export function factorDe(crudo: number, cocido: number): number | null {
  return crudo > 0 && cocido > 0 ? Math.round((cocido / crudo) * 100) / 100 : null
}

/** Cuánto es cada ración de una olla: lo que pesa la comida entre las raciones (null si no cuadra). */
export function racionDeOlla(vacia: number, llena: number, raciones: number): number | null {
  return llena > vacia && raciones > 0 ? Math.round((llena - vacia) / raciones) : null
}

/** Un plato tuyo: los ingredientes en crudo y lo que pesa ya cocinado → sus valores por 100 g cocinado. */
export function platoPor100(
  ingredientes: readonly { por100: Macros; gramos: number }[],
  pesoCocinado: number,
): { crudo: number; total: Macros; por100: Macros | null } {
  const partes = ingredientes.map((i) => {
    const k = i.gramos / 100
    return {
      kcal: i.por100.kcal * k,
      protein: i.por100.protein * k,
      carbs: i.por100.carbs * k,
      fat: i.por100.fat * k,
    }
  })
  const total = sumar(partes)
  const crudo = ingredientes.reduce((s, i) => s + i.gramos, 0)
  if (!(pesoCocinado > 0) || !ingredientes.length) return { crudo, total, por100: null }
  const k = 100 / pesoCocinado
  const r1 = (n: number) => Math.round(n * k * 10) / 10
  return {
    crudo,
    total,
    por100: {
      kcal: Math.round(total.kcal * k),
      protein: r1(total.protein),
      carbs: r1(total.carbs),
      fat: r1(total.fat),
    },
  }
}

/** Lo que se cuece con agua y cambia mucho de peso: de estos se dice lo que es en crudo. */
const SE_CUECEN = ['Cereales', 'Legumbres']
const sinCoccion = (nombre: string) =>
  nombre
    .toLowerCase()
    .replace(/\((cocid[oa]s?|crud[oa]s?|sec[oa]s?)\)/g, ' ')
    .replace(/\b(cocid[oa]s?|crud[oa]s?|sec[oa]s?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Las parejas en crudo de los cereales y legumbres cocidos de la base («Arroz blanco (cocido)» → «Arroz blanco (crudo)»),
 * por el id de lo cocido. De una pasada (con un índice por nombre): la base tiene miles de alimentos.
 */
export function parejasEnCrudo(
  base: readonly Alimento[],
): Map<string, { cocido: Alimento; crudo: Alimento }> {
  const crudos = new Map<string, Alimento>()
  for (const a of base)
    if (SE_CUECEN.includes(a.category) && /crud[oa]|sec[oa]/i.test(a.name) && !crudos.has(sinCoccion(a.name)))
      crudos.set(sinCoccion(a.name), a)
  const parejas = new Map<string, { cocido: Alimento; crudo: Alimento }>()
  for (const c of base) {
    if (!SE_CUECEN.includes(c.category) || !/cocid[oa]/i.test(c.name)) continue
    const crudo = crudos.get(sinCoccion(c.name))
    // Al cocerse con agua pesa más: si no, no es la pareja que se busca
    if (crudo && crudo.id !== c.id && crudo.kcal > c.kcal) parejas.set(c.id, { cocido: c, crudo })
  }
  return parejas
}

/** La pareja en crudo de un cereal o una legumbre cocidos; null si no es de lo que se cuece o la base no la tiene. */
export const parejaEnCrudo = (cocido: Alimento, base: readonly Alimento[]): Alimento | null =>
  parejasEnCrudo(base).get(cocido.id)?.crudo ?? null

/**
 * Los gramos en crudo de unos gramos cocidos, por sus kcal (lo cocido gana agua, no kcal), de 5 en 5: 250 g de arroz
 * cocido (130 kcal/100 g) son unos 90 g en crudo (355 kcal/100 g). Es aproximado: depende de cuánta agua coja.
 */
export function gramosEnCrudo(gramosCocido: number, cocido: Alimento, crudo: Alimento): number {
  return Math.max(5, Math.round((gramosCocido * cocido.kcal) / crudo.kcal / 5) * 5)
}
