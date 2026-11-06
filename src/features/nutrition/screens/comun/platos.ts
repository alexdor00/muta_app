import { formatInt } from '../../../../shared/lib/format.ts'
import { COMIDAS, type ComidaId, type Macros } from '../../state/comida.ts'

/** «595 kcal · 40 P · 75 HC · 16 G». */
export const macrosCortos = (m: Macros) =>
  `${formatInt(m.kcal)} kcal · ${formatInt(m.protein)} P · ${formatInt(m.carbs)} HC · ${formatInt(m.fat)} G`

/** «Cena», «la cena», «a la cena». */
export const comidaDe = (id: ComidaId) => COMIDAS.find((c) => c.id === id) ?? COMIDAS[0]

export const esComida = (x: unknown): x is ComidaId => COMIDAS.some((c) => c.id === x)
