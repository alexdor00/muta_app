// Lo que MUTA ha entendido de una dieta antes de empezarla (Plan, usuario 2026-11-18): menús y recetas, cómo se repite,
// qué días se cocina, lo de todos los días y lo de un solo tipo de día, y las cantidades que hay que revisar.
import type { Dieta } from './diet.ts'

export type ResumenDieta = {
  menus: number
  recetas: number
  /** El menú de cada día del ciclo, por su nombre corto (A A B B…). */
  ciclo: string[]
  cocinar: number[]
  /** Lo que va todos los días (el batido) y lo de un solo tipo de día (el preentreno). */
  todosLosDias: string[]
  soloEntreno: string[]
  soloDescanso: string[]
  /** Ingredientes con una cantidad aproximada (venían en unidades: «2 huevos (≈110 g, estimado)»). */
  estimados: string[]
  /** Ingredientes sin gramos («al gusto»): no suman kcal. */
  alGusto: string[]
}

const unicos = (xs: string[]) => [...new Set(xs)]

export function resumenDeDieta(d: Dieta): ResumenDieta {
  const corto = (id: string) => (d.menus.find((m) => m.id === id)?.nombre ?? id).replace(/^men[uú]\s+/i, '')
  const ingredientes = d.recetas.flatMap((r) => r.ingredientes)
  return {
    menus: d.menus.length,
    recetas: d.recetas.length,
    ciclo: d.ciclo.map(corto),
    cocinar: [...(d.cocinar ?? [])].sort((a, b) => a - b),
    todosLosDias: unicos(
      d.recetas
        .filter((r) => r.menu === null && !r.soloEntreno && !r.soloDescanso)
        .map((r) => r.rotulo || r.nombre),
    ),
    soloEntreno: unicos(d.recetas.filter((r) => r.soloEntreno).map((r) => r.rotulo || r.nombre)),
    soloDescanso: unicos(d.recetas.filter((r) => r.soloDescanso).map((r) => r.rotulo || r.nombre)),
    estimados: unicos(ingredientes.filter((i) => i.gramos && /estimad|≈/i.test(i.nota)).map((i) => i.nombre)),
    alGusto: unicos(ingredientes.filter((i) => !i.gramos).map((i) => i.nombre)),
  }
}
