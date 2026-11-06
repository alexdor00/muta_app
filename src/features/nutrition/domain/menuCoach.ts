// Tu nutricionista mira tu menú de los próximos días y propone (nunca aplica): si un día no llegas a la proteína, cambiar
// un plato por otro que llegue; si te pasas o te quedas corto de kcal, ajustar los gramos de ese día. La proteína y las
// kcal del día son tu objetivo (docs/conocimiento/02-reglas.md · sección 8); los umbrales para avisar (15 g, 200 kcal)
// son sugeridos.
import { formatDayDate, formatInt } from '../../../shared/lib/format.ts'
import { ajustar, mejoresPara, REPARTO } from './fit.ts'
import { COMIDAS, type Macros } from './food.ts'
import { huecosDelDia, totalDeHueco, totalDelDia, type Hueco, type MenuSemanal } from './menu.ts'
import type { Plato } from './recipes.ts'

export const UMBRAL_PROTEINA = 15
export const UMBRAL_KCAL = 200

export type PropuestaMenu = {
  id: string
  fecha: string
  tipo: 'proteina' | 'kcal'
  titulo: string
  detalle: string
  antes: Hueco[]
  despues: Hueco[]
}

const nombreComida = (c: Hueco['comida']) => COMIDAS.find((x) => x.id === c)?.el ?? c

/** Un sello de los platos y gramos de un día: si cambias algo, la propuesta (y su «Ahora no») es otra. */
const sello = (hs: readonly Hueco[]) =>
  hs.map((h) => `${h.comida}:${h.plato}:${(h.gramos ?? []).join('.')}`).join(',')

/** Las propuestas para unos días (los que tienen al menos 3 comidas en el menú). */
export function propuestasDelMenu(
  menu: MenuSemanal,
  fechas: readonly string[],
  platos: readonly Plato[],
  objetivoDe: (fecha: string) => Macros | null,
): PropuestaMenu[] {
  const platoDe = (id: string) => platos.find((p) => p.id === id) ?? null
  const fuera: PropuestaMenu[] = []
  for (const fecha of fechas) {
    const objetivo = objetivoDe(fecha)
    const huecos = huecosDelDia(menu, fecha).filter((h) => platoDe(h.plato))
    if (!objetivo || huecos.length < 3) continue
    const total = totalDelDia(menu, fecha, platoDe)
    const dia = formatDayDate(fecha)
    const id = (tipo: string) => `${tipo}-${fecha}-${sello(huecos)}`
    const falta = objetivo.protein - total.protein
    if (falta >= UMBRAL_PROTEINA) {
      // El cambio de un plato que más proteína suma sin mover mucho las kcal de esa comida
      let mejor: { h: Hueco; nuevo: Hueco; plato: Plato; gana: number } | null = null
      for (const h of huecos) {
        const actual = totalDeHueco(h, platoDe(h.plato)!)
        // Las mismas kcal: lo que sube de proteína, lo baja de hidratos
        const quiero = {
          ...actual,
          protein: actual.protein + falta,
          carbs: Math.max(0, actual.carbs - falta),
        }
        for (const e of mejoresPara(platos, h.comida, quiero, 8, [h.plato])) {
          const gana = e.ajuste.total.protein - actual.protein
          if (Math.abs(e.ajuste.total.kcal - actual.kcal) > Math.max(120, actual.kcal * 0.2)) continue
          if (!mejor || gana > mejor.gana)
            mejor = {
              h,
              plato: e.plato,
              gana,
              nuevo: { ...h, plato: e.plato.id, gramos: e.ajuste.gramos, cocinado: null },
            }
        }
      }
      if (mejor && mejor.gana >= 5) {
        fuera.push({
          id: id('proteina'),
          fecha,
          tipo: 'proteina',
          titulo: `El ${dia} no llegas a la proteína`,
          detalle: `Con tu menú te quedas en ${formatInt(total.protein)} de ${formatInt(objetivo.protein)} g. Si cambias ${nombreComida(mejor.h.comida)} por ${mejor.plato.nombre}, llegas a ${formatInt(total.protein + mejor.gana)} g.`,
          antes: [mejor.h],
          despues: [mejor.nuevo],
        })
        continue
      }
    }
    const dif = total.kcal - objetivo.kcal
    if (Math.abs(dif) >= UMBRAL_KCAL) {
      const suma = huecos.reduce((s, h) => s + REPARTO[h.comida], 0)
      const despues = huecos.map((h) => {
        const f = REPARTO[h.comida] / suma
        const parte = {
          kcal: objetivo.kcal * f,
          protein: objetivo.protein * f,
          carbs: objetivo.carbs * f,
          fat: objetivo.fat * f,
        }
        return { ...h, gramos: ajustar(platoDe(h.plato)!, parte).gramos }
      })
      const nuevo = totalDelDia(
        { ...menu, huecos: [...menu.huecos.filter((h) => h.fecha !== fecha), ...despues] },
        fecha,
        platoDe,
      )
      if (Math.abs(nuevo.kcal - objetivo.kcal) < Math.abs(dif) - 50)
        fuera.push({
          id: id('kcal'),
          fecha,
          tipo: 'kcal',
          titulo:
            dif > 0
              ? `El ${dia} te pasas ${formatInt(dif)} kcal`
              : `El ${dia} te faltan ${formatInt(-dif)} kcal`,
          detalle: `Ajustando los gramos de sus comidas quedas en ${formatInt(nuevo.kcal)} de ${formatInt(objetivo.kcal)} kcal.`,
          antes: huecos,
          despues,
        })
    }
  }
  return fuera.filter((p) => !menu.descartadas.includes(p.id))
}
