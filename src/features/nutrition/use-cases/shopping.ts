// La lista de la compra: para cuántos días y desde cuándo, lo que ya tienes, lo que añades y las raciones de más.
// Sale siempre de las recetas (domain/shopping.ts): no hay otra copia que se desactualice.
import { libroExcel, TIPO_EXCEL } from '../../../shared/lib/excel.ts'
import { addDays, formatDecimal, formatInt, formatLongDate } from '../../../shared/lib/format.ts'
import { platform } from '../../../shared/platform/index.ts'
import { huecosDelDia, platosDe } from '../domain/menu.ts'
import { recetasDelMenu } from '../domain/menuCocina.ts'
import { extrasDeDias } from '../domain/menuExtras.ts'
import { listaDeLaCompra, seccionesDeLaCompra, textoDeLaCompra, type Producto } from '../domain/shopping.ts'
import { hoy, tipoDe } from '../state/comida.ts'
import { enCrudo, gramosDeHueco, menu, platoPorId } from '../state/recetas.ts'
import { COMIDAS } from '../domain/food.ts'
import { compra, diaDe, type Compra } from '../state/dieta.ts'
import { guardarCompra } from './nutritionStore.ts'
import { compraDeLaSemana, piloto, type PorComprar } from '../state/autopilot.ts'
import { guardarMenu } from './menu.ts'
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
const delMenu = (fechas: readonly string[]) => [
  ...recetasDelMenu(menu.value, fechas, (id) => platoPorId(id), gramosDeHueco),
  ...extrasDeDias(menu.value, fechas, (id) => platoPorId(id)),
]

/** Los menús que elijas, cada uno las veces que digas (con sus gramos para tu objetivo de hoy). */
/** Cuántas veces va un menú en la compra «por menús»: una, si no lo has cambiado (con ×0, la lista salía vacía). */
export const vecesEnLaCompra = (veces: Readonly<Record<string, number>> | undefined, id: string) =>
  veces?.[id] ?? 1

function deMenus(veces: Record<string, number>) {
  return menu.value.menus.flatMap((m) =>
    Array.from({ length: vecesEnLaCompra(veces, m.id) }, () =>
      COMIDAS.flatMap(({ id: comida }) => {
        // El plato del tipo de día de hoy; si el menú solo lleva uno (de entreno o de descanso), ese
        const id =
          platosDe(m, tipoDe(hoy.value) === 'descanso')[comida] ?? m.platos[comida] ?? m.descanso?.[comida]
        const p = id ? platoPorId(id) : null
        const extras = (m.extras?.[comida] ?? []).map((x) => ({
          alimentoId: x.alimentoId,
          nombre: x.nombre,
          categoria: x.categoria,
          g: x.gramos,
        }))
        const ademas = extras.length
          ? [{ id: `extras-${comida}`, nombre: 'Además del plato', deMenu: m.nombre, lista: extras }]
          : []
        if (!p) return ademas
        const g = gramosDeHueco({ fecha: hoy.value, comida, menu: m.id, plato: p.id, cocinado: null }, p)
        return [
          {
            id: p.id,
            nombre: p.nombre,
            deMenu: m.nombre,
            lista: p.ingredientes.map((i, k) => ({
              alimentoId: i.alimentoId,
              nombre: i.nombre,
              categoria: i.categoria,
              g: i.cuenta && i.gramos !== null ? Math.round(g[k] ?? i.gramos) : null,
            })),
          },
          ...ademas,
        ]
      }),
    ).flat(),
  )
}

export const modoDeCompra = (modo: 'dias' | 'menus' | 'semana') => cambiar({ modo })

/** Cómo sale la lista: la que elegiste o, con día de compra en tu semana resuelta, hasta tu próxima compra. */
export function modoActual(c: Compra): 'dias' | 'menus' | 'semana' {
  if (c.modo === 'semana' && !piloto.value?.compra) return 'dias'
  return c.modo ?? (piloto.value?.compra ? 'semana' : 'dias')
}

/**
 * Tu semana resuelta: marca algo de tu próxima compra como comprado o lo desmarca.
 */
export async function marcarComprado(p: PorComprar, fecha: string): Promise<void> {
  const c = compraActual()
  const compradas = c.semanaDe === fecha ? { ...(c.compradas ?? {}) } : {}
  if (p.clave in compradas) delete compradas[p.clave]
  else compradas[p.clave] = p.gramos
  await cambiar({ semanaDe: fecha, compradas })
}

/** Cuántas veces entra un menú en la compra (0 a 7). */
export function vecesDeMenu(id: string, cambio: 1 | -1): Promise<void> {
  const c = compraActual()
  const n = Math.min(7, Math.max(0, vecesEnLaCompra(c.menus, id) + cambio))
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
export async function compartirCompra(): Promise<'shared' | 'saved' | 'copied' | 'none'> {
  const c = compraActual()
  const semana = modoActual(c) === 'semana' ? compraDeLaSemana.value : null
  const productos = semana ? semana.faltan : productosDe(c).productos
  const tienes = semana
    ? new Set([...semana.faltan.filter((x) => x.comprado).map((x) => x.clave), ...c.tienes])
    : new Set(c.tienes)
  const secciones = seccionesDeLaCompra(productos, tienes, c.propios)
  const cosas = secciones.reduce((n, s) => n + s.cosas.length, 0)
  const fecha = semana?.fecha ?? c.desde
  const libro = libroExcel(
    'La compra',
    [5, 36, 12, 24],
    [
      { tipo: 'titulo', celdas: ['La compra'] },
      {
        tipo: 'subtitulo',
        celdas: [`${formatLongDate(fecha)} · ${cosas} ${cosas === 1 ? 'cosa' : 'cosas'} · MUTA`],
      },
      { tipo: 'vacia', celdas: [] },
      ...secciones.flatMap((s) => [
        { tipo: 'seccion' as const, celdas: [`${s.nombre} · ${s.cosas.length}`] },
        ...s.cosas.map((x) => ({
          tipo: 'fila' as const,
          celdas: [
            '☐',
            x.nombre,
            x.gramos ? cantidad(x.gramos) : 'al gusto',
            (x.gramos && enCrudo(x.clave, x.gramos)) || '',
          ],
        })),
        { tipo: 'vacia' as const, celdas: [] },
      ]),
    ],
  )
  const archivo = new File([libro], `La compra ${fecha}.xlsx`, { type: TIPO_EXCEL })
  const r = await platform.shareFile('La compra', archivo)
  if (r !== 'none') return r
  // Si no se pudo con el archivo, el texto de siempre
  return platform.share('La compra', textoDeLaCompra(productos, tienes, c.propios, cantidad))
}

/** Especias y básicos: salen tachados; destachar uno es que te falta (y entra en «Te faltan»). */
export function basicoFalta(clave: string): Promise<void> {
  const c = compraActual()
  const xs = c.faltanBasicos ?? []
  return cambiar({ faltanBasicos: xs.includes(clave) ? xs.filter((x) => x !== clave) : [...xs, clave] })
}

/** Cada cuántas semanas compras (1, 2 o 4): la lista lleva todo lo de tus menús hasta la siguiente. */
export async function cadaCuantoCompras(semanas: number): Promise<void> {
  const p = piloto.value
  if (!p?.compra) return
  await guardarMenu({ ...menu.value, piloto: { ...p, compra: { ...p.compra, semanas } } })
}
