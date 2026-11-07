import { formatInt } from '../../../../shared/lib/format.ts'
import { COMIDAS, type ComidaId, type Macros } from '../../state/comida.ts'

/** Espacio duro: cada cifra con su unidad en la misma línea (nunca queda una «G» sola abajo). */
const D = ' '

/** «595 kcal · 40 P · 75 HC · 16 G». */
export const macrosCortos = (m: Macros) =>
  `${formatInt(m.kcal)}${D}kcal · ${formatInt(m.protein)}${D}P · ${formatInt(m.carbs)}${D}HC · ${formatInt(m.fat)}${D}G`

/** «Cena», «la cena», «a la cena». */
export const comidaDe = (id: ComidaId) => COMIDAS.find((c) => c.id === id) ?? COMIDAS[0]

export const esComida = (x: unknown): x is ComidaId => COMIDAS.some((c) => c.id === x)
