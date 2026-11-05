// La lista de la compra: sale de las recetas de los días elegidos, con la ración de entreno o de descanso de cada día y
// las raciones de más de quien coma contigo. Regla del prototipo anterior (js/comida/dieta.js · shopCompute).
import { plainText } from '../../../shared/lib/format.ts'
import type { RecetaDelDia } from './diet.ts'

/** Secciones de la lista y qué categorías de la base van en cada una (nombres sugeridos: el prototipo los ponía así). */
export const SECCIONES: { id: string; nombre: string; categorias: string[] }[] = [
  { id: 'carne', nombre: 'Carne y pescado', categorias: ['Carnes', 'Pescados', 'Embutidos'] },
  { id: 'lacteos', nombre: 'Huevos y lácteos', categorias: ['Huevos y lácteos'] },
  { id: 'pan', nombre: 'Cereales y pan', categorias: ['Cereales'] },
  { id: 'fruta', nombre: 'Fruta, verdura y tubérculos', categorias: ['Frutas', 'Verduras', 'Tubérculos'] },
  { id: 'despensa', nombre: 'Despensa', categorias: ['Legumbres', 'Dulces', 'Snacks', 'Platos', 'Bebidas'] },
  { id: 'aceites', nombre: 'Aceites y especias', categorias: ['Grasas'] },
  { id: 'suple', nombre: 'Suplementos', categorias: ['Suplementos'] },
]

/** Sección de una categoría (lo que no está, a la despensa). */
export function seccionDe(categoria: string): string {
  return SECCIONES.find((s) => s.categorias.includes(categoria))?.id ?? 'despensa'
}

export type Producto = {
  /** El alimento de la base o, si no hay, su nombre sin tildes. */
  clave: string
  nombre: string
  seccion: string
  /** Gramos en total; null si va sin cantidad («al gusto»). */
  gramos: number | null
  /** Las recetas en las que va. */
  usos: string[]
}

/** Lo que hay que comprar para estos días (con `extra[receta]` raciones de más). */
export function listaDeLaCompra(
  dias: readonly { recetas: readonly RecetaDelDia[] }[],
  extra: Readonly<Record<string, number>> = {},
): Producto[] {
  const productos = new Map<string, Producto>()
  for (const dia of dias)
    for (const r of dia.recetas) {
      const veces = 1 + (extra[r.id] ?? 0)
      for (const i of r.lista) {
        const clave = i.alimentoId ?? plainText(i.nombre)
        const p = productos.get(clave) ?? {
          clave,
          nombre: i.nombre.replace(/\s*\((en )?crud[oa]\)/i, ''),
          seccion: seccionDe(i.categoria),
          gramos: null,
          usos: [],
        }
        if (i.g !== null) p.gramos = (p.gramos ?? 0) + i.g * veces
        if (!p.usos.includes(r.nombre)) p.usos.push(r.nombre)
        productos.set(clave, p)
      }
    }
  return [...productos.values()]
    .map((p) => ({ ...p, gramos: p.gramos === null ? null : Math.round(p.gramos) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

/** La lista como texto, para Notas o WhatsApp: por secciones, con la cantidad y sin lo que ya tienes. */
export function textoDeLaCompra(
  productos: readonly Producto[],
  tienes: ReadonlySet<string>,
  propios: readonly { id: string; nombre: string; seccion: string }[],
  cantidad: (g: number) => string,
): string {
  const lineas: string[] = []
  for (const s of SECCIONES) {
    const de = [
      ...productos
        .filter((p) => p.seccion === s.id && !tienes.has(p.clave))
        .map((p) => `· ${p.nombre}${p.gramos ? `: ${cantidad(p.gramos)}` : ''}`),
      ...propios.filter((p) => p.seccion === s.id && !tienes.has(p.id)).map((p) => `· ${p.nombre}`),
    ]
    if (de.length) lineas.push(s.nombre.toUpperCase(), ...de, '')
  }
  return lineas.join('\n').trim()
}
