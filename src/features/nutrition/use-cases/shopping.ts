// La lista de la compra: para cuántos días y desde cuándo, lo que ya tienes, lo que añades y las raciones de más.
// Sale siempre de las recetas (domain/shopping.ts): no hay otra copia que se desactualice.
import { addDays, formatDecimal, formatInt } from '../../../shared/lib/format.ts'
import { platform } from '../../../shared/platform/index.ts'
import { recetasDelMenu } from '../domain/menu.ts'
import { productoEn } from '../domain/recipes.ts'
import { listaDeLaCompra, textoDeLaCompra, type Producto } from '../domain/shopping.ts'
import { alimentoPorId, hoy } from '../state/comida.ts'
import { menu, platoPorId, productos } from '../state/recetas.ts'
import { compra, diaDe, type Compra } from '../state/dieta.ts'
import { guardarCompra } from './nutritionStore.ts'

/** Para cuántos días se puede hacer la lista (los del prototipo). */
export const DIAS_COMPRA = [3, 4, 6, 7, 10, 14]

/** La lista que llevas o, si no hay, una para 7 días desde hoy. Una lista de días ya pasados empieza hoy. */
export function compraActual(): Compra {
  const c = compra.value ?? {
    id: 'compra',
    target: 'nutricion',
    desde: hoy.value,
    dias: 7,
    tienes: [],
    extra: {},
    propios: [],
  }
  return addDays(c.desde, c.dias - 1) < hoy.value ? { ...c, desde: hoy.value, tienes: [] } : c
}

/** Los platos de tu menú en esos días, con tus productos en vez de los genéricos. */
function delMenu(fechas: readonly string[]) {
  return recetasDelMenu(menu.value, fechas, platoPorId).map((r) => {
    const p = platoPorId(r.id)
    return {
      ...r,
      lista: r.lista.map((i, k) => {
        const tuyo = p ? productoEn(productos.value, p, k) : null
        const a = tuyo ? alimentoPorId(tuyo) : null
        return a ? { ...i, alimentoId: a.id, nombre: a.name, categoria: i.categoria } : i
      }),
    }
  })
}

/**
 * Lo que hay que comprar y cuántos días son de entreno y de descanso. Los días con platos en tu menú salen del menú; los
 * demás, de tu dieta (si sigues una).
 */
export function productosDe(c: Compra): { productos: Producto[]; entreno: number; descanso: number } {
  const fechas = Array.from({ length: c.dias }, (_, i) => addDays(c.desde, i))
  const conMenu = new Set(menu.value.huecos.map((h) => h.fecha))
  const dias = fechas
    .filter((f) => !conMenu.has(f))
    .map(diaDe)
    .filter((d): d is NonNullable<typeof d> => d !== null)
  return {
    productos: listaDeLaCompra(
      [...dias, { recetas: delMenu(fechas.filter((f) => conMenu.has(f))) }],
      c.extra,
    ),
    entreno: dias.filter((d) => d.tipo === 'entreno').length,
    descanso: dias.filter((d) => d.tipo === 'descanso').length,
  }
}

/** «1,25 kg» o «450 g». */
export function cantidad(g: number): string {
  return g >= 1000 ? `${formatDecimal(Math.round(g / 10) / 100)} kg` : `${formatInt(g)} g`
}

const cambiar = (c: Partial<Compra>) => guardarCompra({ ...compraActual(), ...c })

export const paraDias = (dias: number) => cambiar({ dias })
export const desdeElDia = (desde: string) => cambiar({ desde })

/** Marca o desmarca algo que ya tienes. */
export function marcar(clave: string): Promise<void> {
  const c = compraActual()
  return cambiar({
    tienes: c.tienes.includes(clave) ? c.tienes.filter((x) => x !== clave) : [...c.tienes, clave],
  })
}

export const desmarcarTodo = () => cambiar({ tienes: [] })

/** Añade algo a la lista que no sale de las recetas (café, papel de cocina…). */
export function anadirPropio(nombre: string, seccion: string): Promise<void> {
  const n = nombre.trim()
  if (!n) return Promise.resolve()
  const c = compraActual()
  return cambiar({ propios: [...c.propios, { id: `x_${crypto.randomUUID()}`, nombre: n, seccion }] })
}

export function quitarPropio(id: string): Promise<void> {
  const c = compraActual()
  return cambiar({ propios: c.propios.filter((p) => p.id !== id), tienes: c.tienes.filter((x) => x !== id) })
}

/** Raciones de más de una receta (alguien más come ese plato), de 0 a 6. */
export function racionesDeMas(recetaId: string, cambio: 1 | -1): Promise<void> {
  const c = compraActual()
  const n = Math.min(6, Math.max(0, (c.extra[recetaId] ?? 0) + cambio))
  const resto = Object.fromEntries(Object.entries(c.extra).filter(([k]) => k !== recetaId))
  return cambiar({ extra: n ? { ...resto, [recetaId]: n } : resto })
}

/** Comparte la lista como texto (Notas, WhatsApp); si no se puede, la copia. */
export async function compartirCompra(): Promise<'shared' | 'copied' | 'none'> {
  const c = compraActual()
  const texto = textoDeLaCompra(productosDe(c).productos, new Set(c.tienes), c.propios, cantidad)
  return platform.share('La compra', texto)
}
