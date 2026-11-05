// Códigos de barras y Open Food Facts: las variantes de un código (EAN-13, UPC, EAN-8) y cómo se leen los valores por
// 100 g de un producto. Reglas del prototipo anterior (js/comida/productos-super.js · codeVariants, offParse).

/** Solo los dígitos de un código y sus variantes: con o sin el 0 de delante (UPC ↔ EAN-13) y el EAN-8 rellenado. */
export function variantesDeCodigo(codigo: string): string[] {
  const c = codigo.replace(/\D/g, '')
  const v = [c]
  if (c.length === 13 && c.startsWith('0')) v.push(c.slice(1))
  if (c.length === 12) v.push(`0${c}`)
  if (c.length === 8) v.push(`00000${c}`)
  return [...new Set(v)].filter((x) => x.length >= 8)
}

/** ¿Es el mismo código? (sin los ceros de delante). */
export function mismoCodigo(a: string | undefined, b: string): boolean {
  return !!a && a.replace(/^0+/, '') === b.replace(/\D/g, '').replace(/^0+/, '')
}

export type Producto = {
  nombre: string
  marca: string
  /** Por 100 g; null si el producto no trae los valores. */
  por100: { kcal: number; protein: number; carbs: number; fat: number } | null
  /** Gramos de una ración según el envase (si lo dice). */
  racionG: number | null
}

const numero = (x: unknown): number | null => {
  const n = typeof x === 'string' ? Number(x.replace(',', '.')) : x
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null
}
const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Un producto de la respuesta de Open Food Facts (`/api/v2/product/<código>`), o null si no está. Las kcal, de
 * «energy-kcal_100g» o, si no hay, de los kJ (÷ 4,184).
 */
export function productoDeOff(respuesta: unknown): Producto | null {
  const r = respuesta as { status?: number; product?: Record<string, unknown> } | null
  const p = r?.product
  if (!p || r?.status === 0) return null
  const nombre = String(p.product_name_es || p.product_name || '').trim()
  const n = (p.nutriments ?? {}) as Record<string, unknown>
  const kj = numero(n['energy_100g']) ?? numero(n['energy-kj_100g'])
  const kcal = numero(n['energy-kcal_100g']) ?? (kj !== null ? kj / 4.184 : null)
  const protein = numero(n['proteins_100g'])
  const carbs = numero(n['carbohydrates_100g'])
  const fat = numero(n['fat_100g'])
  const completo = kcal !== null && protein !== null && carbs !== null && fat !== null
  return {
    nombre,
    marca: String(p.brands ?? '')
      .split(',')[0]
      .trim(),
    por100: completo
      ? { kcal: Math.round(kcal), protein: r1(protein), carbs: r1(carbs), fat: r1(fat) }
      : null,
    racionG: numero(p.serving_quantity),
  }
}
