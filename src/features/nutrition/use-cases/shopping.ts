// La lista de la compra: para cuántos días y desde cuándo, lo que ya tienes, lo que añades y las raciones de más.
// Sale siempre de las recetas (domain/shopping.ts): no hay otra copia que se desactualice.
import { addDays, formatDecimal, formatInt } from '../../../shared/lib/format.ts'
import { platform } from '../../../shared/platform/index.ts'
import { huecosDelDia, recetasDelMenu } from '../domain/menu.ts'
import { listaDeLaCompra, textoDeLaCompra, type Producto } from '../domain/shopping.ts'
import { hoy } from '../state/comida.ts'
import { gramosDeHueco, menu, platoPorId } from '../state/recetas.ts'
import { COMIDAS } from '../domain/food.ts'
import { compra, diaDe, type Compra } from '../state/dieta.ts'
import { guardarCompra } from './nutritionStore.ts'
import { nuevoId } from '../../../shared/lib/id.ts'

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

/** Los platos de tu menú en esos días (con tus cambios y sus gramos de cada día). */
const delMenu = (fechas: readonly string[]) =>
  recetasDelMenu(menu.value, fechas, (id) => platoPorId(id), gramosDeHueco)

/** Los menús que elijas, cada uno las veces que digas (con sus gramos para tu objetivo de hoy). */
function deMenus(veces: Record<string, number>) {
  return menu.value.menus.flatMap((m) =>
    Array.from({ length: veces[m.id] ?? 0 }, () =>
      COMIDAS.flatMap(({ id: comida }) => {
        const id = m.platos[comida]
        const p = id ? platoPorId(id) : null
        if (!p) return []
        const g = gramosDeHueco({ fecha: hoy.value, comida, menu: m.id, plato: p.id, cocinado: null }, p)
        return [
          {
            id: p.id,
            nombre: p.nombre,
            lista: p.ingredientes.map((i, k) => ({
              alimentoId: i.alimentoId,
              nombre: i.nombre,
              categoria: i.categoria,
              g: i.cuenta && i.gramos !== null ? Math.round(g[k] ?? i.gramos) : null,
            })),
          },
        ]
      }),
    ).flat(),
  )
}

export const modoDeCompra = (modo: 'dias' | 'menus') => cambiar({ modo })

/** Cuántas veces entra un menú en la compra (0 a 7). */
export function vecesDeMenu(id: string, cambio: 1 | -1): Promise<void> {
  const c = compraActual()
  const n = Math.min(7, Math.max(0, (c.menus?.[id] ?? 0) + cambio))
  return cambiar({ modo: 'menus', menus: { ...(c.menus ?? {}), [id]: n } })
}

/**
 * Lo que hay que comprar y cuántos días son de entreno y de descanso. Los días con platos en tu menú salen del menú; los
 * demás, de tu dieta (si sigues una).
 */
export function productosDe(c: Compra): { productos: Producto[]; entreno: number; descanso: number } {
  if (c.modo === 'menus')
    return {
      productos: listaDeLaCompra([{ recetas: deMenus(c.menus ?? {}) }], c.extra),
      entreno: 0,
      descanso: 0,
    }
  const fechas = Array.from({ length: c.dias }, (_, i) => addDays(c.desde, i))
  const conMenu = new Set(fechas.filter((f) => huecosDelDia(menu.value, f).length))
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
  return cambiar({ propios: [...c.propios, { id: `x_${nuevoId()}`, nombre: n, seccion }] })
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
