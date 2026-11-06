// Ajustar un plato a lo que te falta: se mueven los gramos de los ingredientes que aportan (de 5 en 5 g, entre la mitad
// y dos veces y media lo del libro: límites sugeridos) para acercarse a la vez a la proteína, los hidratos y la grasa
// (las kcal salen de los tres). Se parte siempre del total del plato (el del libro) y se suma la diferencia de lo que
// cambia, con los valores por 100 g de cada ingrediente. Lo que no se mueve (especias, verdura, «al gusto») se queda igual.
import type { ComidaId, Macros } from './food.ts'
import { MACROS, vaCon, type MacroId, type Plato } from './recipes.ts'

/** De la mitad a dos veces y media los gramos del libro (sugerido). */
export const LIMITES = { min: 0.5, max: 2.5 }
export const PASO_G = 5

/** Qué parte del día va en cada comida al repartir un objetivo (sugerido: ningún documento lo fija). */
export const REPARTO: Record<ComidaId, number> = { desayuno: 0.25, comida: 0.35, merienda: 0.15, cena: 0.25 }

/** Los valores por 100 g con los que cuenta cada ingrediente (tu producto en vez del genérico); null, el del plato. */
export type Valores = readonly (Macros | null)[]

export type Ajuste = {
  /** Gramos de cada ingrediente (null si no tiene). */
  gramos: (number | null)[]
  total: Macros
  /** Lo que se queda corto o se pasa de más (más de 8 g o de un 10 %). */
  corto: MacroId[]
  sobra: MacroId[]
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Los gramos del plato tal cual. */
export const gramosDelPlato = (p: Plato): (number | null)[] => p.ingredientes.map((i) => i.gramos)

/**
 * El total de un plato con otros gramos y otros valores: el del libro más la diferencia de cada ingrediente que cambia.
 * `veces` multiplica el plato entero (raciones).
 */
export function totalCon(
  p: Plato,
  gramos: readonly (number | null)[],
  valores: Valores = [],
  veces = 1,
): Macros {
  const t = { ...p.total }
  p.ingredientes.forEach((i, k) => {
    if (!i.cuenta || !i.por100 || i.gramos === null) return
    const g = gramos[k] ?? i.gramos
    const v = valores[k] ?? i.por100
    t.kcal += (g * v.kcal - i.gramos * i.por100.kcal) / 100
    t.protein += (g * v.protein - i.gramos * i.por100.protein) / 100
    t.carbs += (g * v.carbs - i.gramos * i.por100.carbs) / 100
    t.fat += (g * v.fat - i.gramos * i.por100.fat) / 100
  })
  const f = veces / p.raciones
  return {
    kcal: Math.max(0, Math.round(t.kcal * f)),
    protein: Math.max(0, r1(t.protein * f)),
    carbs: Math.max(0, r1(t.carbs * f)),
    fat: Math.max(0, r1(t.fat * f)),
  }
}

const margen = (objetivo: number) => Math.max(8, objetivo * 0.1)

/** Qué se queda corto y qué sobra frente a un objetivo. */
export function desvio(total: Macros, objetivo: Macros): { corto: MacroId[]; sobra: MacroId[] } {
  const corto: MacroId[] = []
  const sobra: MacroId[] = []
  for (const { id } of MACROS) {
    const d = total[id] - objetivo[id]
    if (d < -margen(objetivo[id])) corto.push(id)
    else if (d > margen(objetivo[id])) sobra.push(id)
  }
  return { corto, sobra }
}

/** Lo que se puede mover: índice, gramos del libro, valores por gramo (en kcal de cada macro) y límites. */
function movibles(p: Plato, valores: Valores) {
  return p.ingredientes.flatMap((i, k) => {
    if (!p.ajustable || !i.macro || !i.por100 || i.gramos === null || i.gramos <= 0) return []
    const v = valores[k] ?? i.por100
    return [
      {
        k,
        g0: i.gramos,
        a: MACROS.map((m) => (v[m.id] * m.kcalPorG) / 100),
        min: Math.max(PASO_G, Math.round((i.gramos * LIMITES.min) / PASO_G) * PASO_G),
        max: Math.round((i.gramos * LIMITES.max) / PASO_G) * PASO_G,
      },
    ]
  })
}

/** Error de un total frente al objetivo, en kcal de cada macro (al cuadrado). */
function error(t: Macros, o: Macros): number {
  return MACROS.reduce((s, m) => s + ((t[m.id] - o[m.id]) * m.kcalPorG) ** 2, 0)
}

/**
 * Los gramos que más acercan el plato al objetivo. Se busca coordenada a coordenada (cada ingrediente a su mejor valor
 * dentro de sus límites, varias vueltas), se redondea de 5 en 5 g y se repasa a pasos de 5 g por si el redondeo empeoró.
 */
export function ajustar(p: Plato, objetivo: Macros, valores: Valores = []): Ajuste {
  const mv = movibles(p, valores)
  const gramos = p.ingredientes.map((i) => i.gramos)
  if (!mv.length) {
    const total = totalCon(p, gramos, valores)
    return { gramos, total, ...desvio(total, objetivo) }
  }
  // Residuo (total − objetivo) en kcal de cada macro, con los gramos de ahora
  const base = totalCon(p, gramos, valores)
  const res = MACROS.map((m) => (base[m.id] - objetivo[m.id]) * m.kcalPorG)
  const g = mv.map((x) => x.g0)
  // Un poco de apego a los gramos del libro, para que entre dos soluciones igual de buenas elija la más parecida
  const apego = 0.02
  for (let vuelta = 0; vuelta < 60; vuelta++) {
    mv.forEach((x, j) => {
      const aa = x.a.reduce((s, v) => s + v * v, 0)
      if (!aa) return
      // Mejor cambio de este ingrediente con el resto quieto
      const sinEl = res.map((r, m) => r - x.a[m] * (g[j] - x.g0))
      const ar = x.a.reduce((s, v, m) => s + v * sinEl[m], 0)
      const optimo = x.g0 - ar / (aa + apego)
      const nuevo = Math.min(x.max, Math.max(x.min, optimo))
      for (let m = 0; m < 3; m++) res[m] = sinEl[m] + x.a[m] * (nuevo - x.g0)
      g[j] = nuevo
    })
  }
  const redondo = g.map((v) => Math.round(v / PASO_G) * PASO_G)
  const probar = (gs: number[]) => {
    const todos = [...gramos]
    mv.forEach((x, j) => (todos[x.k] = gs[j]))
    return { todos, e: error(totalCon(p, todos, valores), objetivo) }
  }
  let mejor = probar(redondo)
  for (let mejora = true, n = 0; mejora && n < 20; n++) {
    mejora = false
    for (let j = 0; j < mv.length; j++)
      for (const paso of [-PASO_G, PASO_G]) {
        const gs = mv.map((_, i) => (i === j ? redondo[i] + paso : redondo[i]))
        if (gs[j] < mv[j].min || gs[j] > mv[j].max) continue
        const prueba = probar(gs)
        if (prueba.e < mejor.e) {
          mejor = prueba
          redondo[j] = gs[j]
          mejora = true
        }
      }
  }
  const total = totalCon(p, mejor.todos, valores)
  return { gramos: mejor.todos, total, ...desvio(total, objetivo) }
}

/** Hasta cuánto de un macro llega el plato con lo que lo aporta al máximo y lo demás como está. */
export function llegaHasta(p: Plato, macro: MacroId, valores: Valores = []): number {
  const gramos = p.ingredientes.map((i) => i.gramos)
  for (const x of movibles(p, valores)) {
    const i = p.ingredientes[x.k]
    if (i.macro === macro) gramos[x.k] = x.max
  }
  return Math.round(totalCon(p, gramos, valores)[macro])
}

/** Lo que falta repartido entre comidas según el reparto (normalizado a las que quedan). */
export function repartir(falta: Macros, comidas: readonly ComidaId[]): Record<string, Macros> {
  const suma = comidas.reduce((s, c) => s + REPARTO[c], 0) || 1
  return Object.fromEntries(
    comidas.map((c) => {
      const f = REPARTO[c] / suma
      return [
        c,
        {
          kcal: Math.round(falta.kcal * f),
          protein: r1(falta.protein * f),
          carbs: r1(falta.carbs * f),
          fat: r1(falta.fat * f),
        },
      ]
    }),
  )
}

export type Encaje = { plato: Plato; ajuste: Ajuste; error: number }

/** Los platos que mejor encajan en una comida con un objetivo, ya ajustados (los mejores primero). */
export function mejoresPara(
  platos: readonly Plato[],
  comida: ComidaId,
  objetivo: Macros,
  n = 3,
  sin: readonly string[] = [],
  /** false: también los que no son de esa comida (eliges tú la categoría). */
  soloDeLaComida = true,
): Encaje[] {
  return platos
    .filter((p) => p.raciones === 1 && (!soloDeLaComida || vaCon(p, comida)) && !sin.includes(p.id))
    .map((plato) => {
      const ajuste = ajustar(plato, objetivo)
      return { plato, ajuste, error: error(ajuste.total, objetivo) }
    })
    .sort((x, y) => x.error - y.error)
    .slice(0, n)
}

/**
 * Cuadrar el día: un plato para cada comida que queda, con lo que falta repartido. Cada comida elige el que mejor encaja
 * sin repetir; `elegidos` fija el de alguna comida (lo cambiaste tú).
 */
export function cuadrarDia(
  platos: readonly Plato[],
  falta: Macros,
  comidas: readonly ComidaId[],
  elegidos: Readonly<Partial<Record<ComidaId, string>>> = {},
): { comida: ComidaId; encaje: Encaje }[] {
  const partes = repartir(falta, comidas)
  const usados: string[] = []
  return comidas.flatMap((comida) => {
    const fijo = elegidos[comida] ? platos.find((p) => p.id === elegidos[comida]) : undefined
    const encaje = fijo
      ? (() => {
          const ajuste = ajustar(fijo, partes[comida])
          return { plato: fijo, ajuste, error: error(ajuste.total, partes[comida]) }
        })()
      : mejoresPara(platos, comida, partes[comida], 1, usados)[0]
    if (!encaje) return []
    usados.push(encaje.plato.id)
    return [{ comida, encaje }]
  })
}
