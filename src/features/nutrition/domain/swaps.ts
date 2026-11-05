// Intercambios: otros alimentos que dan los mismos gramos del macro principal de un ingrediente (lo que un nutricionista
// llama «intercambio»). Regla del prototipo anterior (js/comida/dieta.js · swap-ing).
import { plainText } from '../../../shared/lib/format.ts'
import type { Alimento, Macros } from './food.ts'

export type MacroPrincipal = 'carbs' | 'protein' | 'fat'

export const NOMBRE_MACRO: Record<MacroPrincipal, string> = {
  carbs: 'hidratos',
  protein: 'proteína',
  fat: 'grasa',
}

/** El macro que más kcal aporta (los hidratos ganan los empates, como en el prototipo). */
export function macroPrincipal(m: Pick<Macros, 'protein' | 'carbs' | 'fat'>): MacroPrincipal {
  if (m.carbs * 4 >= m.protein * 4 && m.carbs * 4 >= m.fat * 9) return 'carbs'
  return m.protein * 4 >= m.fat * 9 ? 'protein' : 'fat'
}

/** Dónde se buscan los cambios de cada macro (categorías de la base). */
const CATEGORIAS: Record<MacroPrincipal, string[]> = {
  carbs: ['Cereales', 'Tubérculos', 'Legumbres'],
  protein: ['Carnes', 'Pescados', 'Huevos y lácteos', 'Embutidos', 'Legumbres'],
  fat: ['Grasas'],
}

export type Intercambio = { alimento: Alimento; gramos: number; kcal: number; diferencia: number }

/**
 * Hasta 9 cambios para `gramos` de un ingrediente (valores por 100 g): mismos gramos de su macro principal, en múltiplos de 5,
 * del más parecido en kcal al menos. Se evita lo cocinado (se pesa en crudo, salvo las legumbres de bote), el mismo alimento
 * (también su harina o su bebida), lo de desayunar y las harinas.
 */
export function intercambios(
  ingrediente: { nombre: string; por100: Macros },
  gramos: number,
  base: readonly Alimento[],
): { macro: MacroPrincipal; cantidad: number; lista: Intercambio[] } {
  const macro = macroPrincipal(ingrediente.por100)
  const cantidad = (ingrediente.por100[macro] * gramos) / 100
  const kcal = (ingrediente.por100.kcal * gramos) / 100
  const propio = plainText(ingrediente.nombre).slice(0, 6)
  // La palabra principal del ingrediente («arroz»): tampoco vale su harina o su bebida
  const palabra = plainText(ingrediente.nombre).split(/[^a-zñ]+/)[0] ?? ''
  const lista = base
    .filter((a) => {
      const n = plainText(a.name)
      if (!CATEGORIAS[macro].includes(a.category) || macroPrincipal(a) !== macro || !(a[macro] > 0))
        return false
      if (/cocid|horno|asad|frit|plancha/.test(n) && !/lentejas|garbanzos|alubias/.test(n)) return false
      if (n.slice(0, 6) === propio || (palabra.length >= 4 && n.includes(palabra))) return false
      // Lo de desayunar y las harinas no se cambian por un plato (el prototipo quitaba lo de desayuno)
      return !/desayuno|galletas|muesli|zumo|refresco|cereales|flakes|harina/.test(n)
    })
    .map((a) => {
      const g = Math.round(((cantidad / a[macro]) * 100) / 5) * 5
      const k = Math.round((a.kcal * g) / 100)
      return { alimento: a, gramos: g, kcal: k, diferencia: k - Math.round(kcal) }
    })
    .filter((x) => x.gramos > 0 && x.gramos < 1000)
    .sort((x, y) => Math.abs(x.diferencia) - Math.abs(y.diferencia))
    .slice(0, 9)
  return { macro, cantidad: Math.round(cantidad * 10) / 10, lista }
}

/** A partir de cuántas kcal de más conviene compensar en otra comida (prototipo). */
export const COMPENSAR = 50
