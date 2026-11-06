// Tu nutricionista mira cada menú en su próximo día y propone (nunca aplica): si ese día no llegas a la proteína, cambiar
// un plato del menú por otro que llegue; si te faltan kcal y al menú le falta una comida, un plato para ella. Los gramos de
// cada plato ya se ajustan solos a tu objetivo de cada día. La proteína y las kcal del día son tu objetivo
// (docs/conocimiento/02-reglas.md · sección 8); los umbrales para avisar (15 g, 200 kcal) son sugeridos.
import { formatInt } from '../../../shared/lib/format.ts'
import { mejoresPara } from './fit.ts'
import { COMIDAS, type ComidaId, type Macros } from './food.ts'
import {
  huecosDelDia,
  menuDelDia,
  totalDelDia,
  type CambioMenu,
  type Hueco,
  type MenuSemanal,
} from './menu.ts'
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
          if (!mejor || gana > mejor.gana) mejor = { h, plato: e.plato, gana }
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
      const [e] = parte ? mejoresPara(c.platos, vacia.id, parte, 1) : []
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
