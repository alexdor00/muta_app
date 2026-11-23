// Lo que va además del plato en tus menús (una fruta, un yogur…; usuario, 2026-11-17) y lo que suma un día con ellos.
import { COMIDAS, macrosDe, sumar, type ComidaId, type Macros } from './food.ts'
import { huecosDelDia, menuDelDia, type ExtraMenu, type Hueco, type MenuSemanal } from './menu.ts'
import { type RecetaDelMenu } from './menuCocina.ts'
import type { Plato } from './recipes.ts'

/** Añade algo más a una comida de un menú. */
export function conExtra(m: MenuSemanal, menu: string, comida: ComidaId, extra: ExtraMenu): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) =>
      x.id === menu || m.comunes?.includes(comida)
        ? { ...x, extras: { ...x.extras, [comida]: [...(x.extras?.[comida] ?? []), extra] } }
        : x,
    ),
  }
}

/** Quita lo que va en la posición `i` de una comida de un menú. */
export function sinExtra(m: MenuSemanal, menu: string, comida: ComidaId, i: number): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) =>
      x.id === menu || m.comunes?.includes(comida)
        ? { ...x, extras: { ...x.extras, [comida]: (x.extras?.[comida] ?? []).filter((_, k) => k !== i) } }
        : x,
    ),
  }
}

/**
 * Cambia los gramos de lo que va en la posición `i` de una comida de un menú (usuario, 2026-11-21: tocar un alimento abre su
 * cantidad). Un plato (`platoId`) va por raciones y no se toca.
 */
export function conGramosDeExtra(
  m: MenuSemanal,
  menu: string,
  comida: ComidaId,
  i: number,
  gramos: number,
): MenuSemanal {
  const nuevo = (x: ExtraMenu): ExtraMenu => {
    // Un alimento guarda sus macros por 100 g (`macrosDeExtra`): basta con sus gramos
    return x.platoId ? x : { ...x, gramos }
  }
  return {
    ...m,
    menus: m.menus.map((x) =>
      x.id === menu || m.comunes?.includes(comida)
        ? {
            ...x,
            extras: {
              ...x.extras,
              [comida]: (x.extras?.[comida] ?? []).map((e, k) => (k === i ? nuevo(e) : e)),
            },
          }
        : x,
    ),
  }
}

/** Lo que va además del plato en una comida de un día (nada si es un día libre). Quitar el plato ese día no lo quita. */
export function extrasDe(
  m: MenuSemanal,
  fecha: string,
  comida: ComidaId,
  tipoDe?: (fecha: string) => 'entreno' | 'descanso',
): ExtraMenu[] {
  // Quitar el plato un día no quita lo de más (usuario, 2026-11-21: deslizar el plato quitaba toda la comida)
  if (m.libres?.includes(fecha)) return []
  const xs = menuDelDia(m, fecha)?.extras?.[comida] ?? []
  // Lo que va solo un tipo de día (el preentreno, los días de entreno)
  return tipoDe ? xs.filter((x) => !x.solo || x.solo === tipoDe(fecha)) : xs
}

/** Lo que lleva un extra: un plato, su ración; un alimento, sus gramos. */
export const macrosDeExtra = (x: ExtraMenu): Macros =>
  x.platoId ? { kcal: x.kcal, protein: x.protein, carbs: x.carbs, fat: x.fat } : macrosDe(x, x.gramos)

/** Lo que suman los extras de una comida. */
export const totalDeExtras = (xs: readonly ExtraMenu[]): Macros => sumar(xs.map(macrosDeExtra))

/** Lo que suma un día con tu menú (`totalDe`: lo de cada comida). */
export function totalDelDia(m: MenuSemanal, fecha: string, totalDe: (h: Hueco) => Macros | null): Macros {
  return sumar([
    ...huecosDelDia(m, fecha).flatMap((h) => {
      const t = totalDe(h)
      return t ? [t] : []
    }),
    ...COMIDAS.map((c) => totalDeExtras(extrasDe(m, fecha, c.id))),
  ])
}

/**
 * Lo que va además del plato en unos días, como una receta más (lo que pide la lista de la compra); un plato, con sus
 * ingredientes de una ración.
 */
export function extrasDeDias(
  m: MenuSemanal,
  fechas: readonly string[],
  platoDe: (id: string) => Plato | null = () => null,
): RecetaDelMenu[] {
  return fechas.flatMap((f) =>
    COMIDAS.flatMap((c) => {
      const xs = extrasDe(m, f, c.id)
      if (!xs.length) return []
      const menu = menuDelDia(m, f)
      return [
        {
          id: `extras-${c.id}`,
          nombre: 'Además del plato',
          deMenu: menu?.nombre ?? '',
          lista: xs.flatMap((x) => {
            const p = x.platoId ? platoDe(x.platoId) : null
            if (x.platoId)
              return (p?.ingredientes ?? []).map((i) => ({
                alimentoId: i.alimentoId,
                nombre: i.nombre,
                categoria: i.categoria,
                g: i.cuenta && i.gramos !== null ? Math.round(i.gramos / (p?.raciones || 1)) : null,
                macro: i.macro,
              }))
            return [
              {
                alimentoId: x.alimentoId,
                nombre: x.nombre,
                categoria: x.categoria,
                g: x.gramos,
                macro: null,
              },
            ]
          }),
        },
      ]
    }),
  )
}
