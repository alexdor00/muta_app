// Cocina: cuánto arroz cocer y cuánto pesa cocido, repartir una olla en raciones y calcular un plato propio por 100 g.
// Reglas del prototipo anterior (js/comida/dieta.js · cocina y js/comida/calculadora-platos.js).
import { sumar, type Macros } from './food.ts'
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
