// Tu nutricionista mira cada menú en su próximo día y propone (nunca aplica): si ese día no llegas a la proteína, cambiar
// un plato del menú por otro que llegue; si te faltan kcal y al menú le falta una comida, un plato para ella. Los gramos de
// cada plato ya se ajustan solos a tu objetivo de cada día. La proteína y las kcal del día son tu objetivo
// (docs/conocimiento/02-reglas.md · sección 8); los umbrales para avisar (15 g, 200 kcal) son sugeridos.
import { formatInt } from '../../../shared/lib/format.ts'
import { mejoresPara } from './fit.ts'
import { COMIDAS, type ComidaId, type Macros } from './food.ts'
import { huecosDelDia, menuDelDia, type CambioMenu, type Hueco, type MenuSemanal } from './menu.ts'
import { totalDelDia } from './menuExtras.ts'
import type { Plato } from './recipes.ts'

export const UMBRAL_PROTEINA = 15
export const UMBRAL_KCAL = 200

export type PropuestaMenu = {
  id: string
  menu: string
  tipo: 'proteina' | 'kcal'
  titulo: string
  detalle: string
  antes: CambioMenu[]
  despues: CambioMenu[]
}

const nombreComida = (c: ComidaId) => COMIDAS.find((x) => x.id === c)?.el ?? c

export type Contexto = {
  platos: readonly Plato[]
  objetivoDe: (fecha: string) => Macros | null
  /** Lo que le toca a una comida de un día. */
  objetivoDeComida: (fecha: string, comida: ComidaId) => Macros | null
  /** Lo que lleva una comida de un día (con sus gramos ajustados). */
  totalDe: (h: Hueco) => Macros | null
  /** Cuántas veces usas un plato (en tus menús): a igualdad, primero los que más usas (usuario, 2026-11-19). */
  usos?: (plato: string) => number
}

/** Las propuestas para tus menús, cada uno mirado en su primer día de `fechas`. */
export function propuestasDelMenu(m: MenuSemanal, fechas: readonly string[], c: Contexto): PropuestaMenu[] {
  const fuera: PropuestaMenu[] = []
  const vistos = new Set<string>()
  for (const fecha of fechas) {
    const menu = menuDelDia(m, fecha)
    if (!menu || vistos.has(menu.id)) continue
    vistos.add(menu.id)
    const objetivo = c.objetivoDe(fecha)
    const huecos = huecosDelDia(m, fecha)
    if (!objetivo || !huecos.length) continue
    const total = totalDelDia(m, fecha, c.totalDe)
    const sello = `${menu.id}:${huecos.map((h) => `${h.comida}=${h.plato}`).join(',')}`
    const falta = objetivo.protein - total.protein
    if (huecos.length >= 3 && falta >= UMBRAL_PROTEINA) {
      let mejor: { h: Hueco; plato: Plato; gana: number } | null = null
      for (const h of huecos) {
        const actual = c.totalDe(h)
        if (!actual) continue
        // Las mismas kcal: lo que sube de proteína, lo baja de hidratos
        const quiero = {
          ...actual,
          protein: actual.protein + falta,
          carbs: Math.max(0, actual.carbs - falta),
        }
        for (const e of mejoresPara(c.platos, h.comida, quiero, 8, [h.plato])) {
          const gana = e.ajuste.total.protein - actual.protein
          if (Math.abs(e.ajuste.total.kcal - actual.kcal) > Math.max(120, actual.kcal * 0.2)) continue
          const usa = (id: string) => c.usos?.(id) ?? 0
          // Lo que usas más gana si llega casi igual (3 g)
          if (
            !mejor ||
            gana > mejor.gana + 3 ||
            (gana >= mejor.gana - 3 && usa(e.plato.id) > usa(mejor.plato.id))
          )
            mejor = { h, plato: e.plato, gana }
        }
      }
      if (mejor && mejor.gana >= 5) {
        fuera.push({
          id: `proteina-${sello}`,
          menu: menu.id,
          tipo: 'proteina',
          titulo: `${menu.nombre}: no llegas a la proteína`,
          detalle: `Te quedas en ${formatInt(total.protein)} de ${formatInt(objetivo.protein)} g. Con ${mejor.plato.nombre} en ${nombreComida(mejor.h.comida)}, llegas a ${formatInt(total.protein + mejor.gana)} g.`,
          antes: [{ menu: menu.id, comida: mejor.h.comida, plato: mejor.h.plato }],
          despues: [{ menu: menu.id, comida: mejor.h.comida, plato: mejor.plato.id }],
        })
        continue
      }
    }
    const faltaKcal = objetivo.kcal - total.kcal
    const vacia = COMIDAS.find((x) => !menu.platos[x.id])
    if (faltaKcal >= UMBRAL_KCAL && vacia) {
      const parte = c.objetivoDeComida(fecha, vacia.id)
      const e = parte ? masUsado(mejoresPara(c.platos, vacia.id, parte, 8), c.usos) : undefined
      if (e)
        fuera.push({
          id: `kcal-${sello}`,
          menu: menu.id,
          tipo: 'kcal',
          titulo: `${menu.nombre}: te faltan ${formatInt(faltaKcal)} kcal`,
          detalle: `Le falta ${vacia.el}. Con ${e.plato.nombre} (${formatInt(e.ajuste.total.kcal)} kcal) cierras el día.`,
          antes: [{ menu: menu.id, comida: vacia.id, plato: null }],
          despues: [{ menu: menu.id, comida: vacia.id, plato: e.plato.id }],
        })
    }
  }
  return fuera.filter((p) => !m.descartadas.includes(p.id))
}

/**
 * De los que encajan, el que más usas entre los que encajan casi tan bien como el mejor (hasta un 30 % más de error):
 * así te propone lo tuyo, con sus gramos para lo que falta.
 */
function masUsado<T extends { plato: Plato; error: number }>(
  xs: readonly T[],
  usos?: (id: string) => number,
): T | undefined {
  const [primero] = xs
  if (!primero || !usos) return primero
  const cerca = xs.filter((x) => x.error <= primero.error * 1.3 + 0.01)
  return cerca.reduce((a, b) => (usos(b.plato.id) > usos(a.plato.id) ? b : a), primero)
}

/**
 * Las opciones para una comida (usuario, 2026-11-19: «que busque primero en favoritos o guardados»): de las que encajan
 * bien (hasta el doble de error que la mejor), primero tus guardadas, luego las que más usas y luego las que
 * mejor encajan. Cada una ya viene con sus gramos para lo que falta.
 */
export function opcionesPara<T extends { plato: Plato; error: number }>(
  xs: readonly T[],
  guardadas: ReadonlySet<string>,
  usos: (id: string) => number,
  n = 4,
): T[] {
  const [primero] = xs
  if (!primero) return []
  const g = (x: T) => (guardadas.has(x.plato.id) ? 1 : 0)
  return xs
    .filter((x) => x.error <= primero.error * 2 + 0.01)
    .sort((a, b) => g(b) - g(a) || usos(b.plato.id) - usos(a.plato.id) || a.error - b.error)
    .slice(0, n)
}
