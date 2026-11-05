// Cocina: el arroz de los próximos días (y tu factor de cocido), y guardar un plato propio en «Mis alimentos».
import { addDays } from '../../../shared/lib/format.ts'
import { arrozDe } from '../domain/kitchen.ts'
import type { Alimento, Macros } from '../domain/food.ts'
import { dieta, hoy } from '../state/comida.ts'
import { diaDe } from '../state/dieta.ts'
import { crearAlimento } from './foodLog.ts'
import { guardarDieta } from './nutritionStore.ts'

/** El arroz que llevan tus recetas en `dias` días desde hoy (cocinar una olla para varios días). */
export function arrozDeLosDias(dias: number) {
  const recetas = Array.from({ length: dias }, (_, i) => diaDe(addDays(hoy.value, i))?.recetas ?? []).flat()
  return arrozDe(recetas, dieta.value?.factorArroz ?? 3)
}

/** Guarda lo que pesa tu arroz cocido por cada gramo en crudo (lo mediste en tu olla). */
export async function guardarFactorArroz(factor: number): Promise<void> {
  const a = dieta.value
  if (a && factor > 0) await guardarDieta({ ...a, factorArroz: factor })
}

/** Guarda un plato tuyo con sus valores por 100 g cocinado y, si la dices, tu ración. */
export function guardarPlato(nombre: string, por100: Macros, racionG: number | null): Promise<Alimento> {
  return crearAlimento({
    name: nombre.trim() || 'Mi plato',
    ...por100,
    servingG: racionG && racionG > 0 ? Math.round(racionG) : 100,
    servingLabel: racionG && racionG > 0 ? 'ración' : '100 g',
  })
}
