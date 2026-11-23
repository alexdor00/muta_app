// De tus menús, lo que se cocina y se compra: los gramos de una vez de un cocinado, lo de hoy con hora, los platos con sus
// ingredientes para la lista de la compra y lo que aguanta la nevera.
import { huecoDe, huecosDelDia, type Cocinado, type Hueco, type MenuSemanal } from './menu.ts'
import type { ComidaId } from './food.ts'
import type { Plato } from './recipes.ts'

/** Gramos de cada ingrediente de un plato en una comida de un día (los ajustados). */
export type GramosDe = (h: Hueco, p: Plato) => (number | null)[]

/** Lo que cocinas de una vez: los gramos de cada ingrediente sumando las comidas (lo que no cuenta, sin cantidad). */
export function paraCocinar(m: MenuSemanal, c: Cocinado, plato: Plato, gramosDe: GramosDe) {
  const huecos = c.para.flatMap((k) => {
    const [fecha, comida] = k.split('|') as [string, ComidaId]
    const h = huecoDe(m, fecha, comida)
    return h && h.plato === plato.id ? [h] : []
  })
  const gramos = huecos.map((h) => gramosDe(h, plato))
  return plato.ingredientes.map((i, k) => ({
    nombre: i.nombre,
    alimentoId: i.alimentoId,
    categoria: i.categoria,
    texto: i.texto,
    macro: i.macro,
    gramos:
      i.gramos === null || !i.cuenta
        ? null
        : Math.round(gramos.reduce((s, g) => s + (g[k] ?? i.gramos ?? 0), 0)),
  }))
}

/** Algo que toca hoy, con su hora. */
export type Tarea =
  | { id: string; tipo: 'compra'; hora: string }
  | { id: string; tipo: 'cocinar'; hora: string; cocinado: Cocinado; raciones: number }

/** Lo de hoy con hora: la compra y lo que cocinas, por hora. */
export function loDeHoy(m: MenuSemanal, fecha: string): Tarea[] {
  const tareas: Tarea[] = []
  if (m.compraEl?.fecha === fecha) tareas.push({ id: 'compra', tipo: 'compra', hora: m.compraEl.hora })
  for (const c of m.cocinados)
    if (c.fecha === fecha)
      tareas.push({
        id: `cocinar-${c.id}`,
        tipo: 'cocinar',
        hora: c.hora,
        cocinado: c,
        raciones: c.para.length,
      })
  return tareas.sort((x, y) => x.hora.localeCompare(y.hora))
}

/** Un plato de tu menú en una comida, con sus ingredientes en gramos (lo que pide la lista de la compra). */
export type RecetaDelMenu = {
  id: string
  nombre: string
  deMenu: string
  lista: {
    alimentoId: string | null
    nombre: string
    categoria: string
    g: number | null
    /** Su macro principal (la proteína se puede hacer al momento). */
    macro: string | null
  }[]
}

/** Los platos de tu menú en unos días, con sus ingredientes en gramos (lo que pide la lista de la compra). */
export function recetasDelMenu(
  m: MenuSemanal,
  fechas: readonly string[],
  platoDe: (id: string) => Plato | null,
  gramosDe: GramosDe,
): RecetaDelMenu[] {
  return recetasDeHuecos(
    m,
    fechas.flatMap((f) => huecosDelDia(m, f)),
    platoDe,
    gramosDe,
  )
}

/** Lo mismo para unas comidas sueltas (las de una tanda, las de una compra de tu semana resuelta). */
export function recetasDeHuecos(
  m: MenuSemanal,
  huecos: readonly Hueco[],
  platoDe: (id: string) => Plato | null,
  gramosDe: GramosDe,
): RecetaDelMenu[] {
  const nombreDe = (id: string) => m.menus.find((x) => x.id === id)?.nombre ?? `Menú ${id}`
  return huecos.flatMap((h) => {
    const p = platoDe(h.plato)
    if (!p) return []
    const gramos = gramosDe(h, p)
    return [
      {
        id: p.id,
        nombre: p.nombre,
        deMenu: nombreDe(h.menu),
        lista: p.ingredientes.map((i, k) => ({
          alimentoId: i.alimentoId,
          nombre: i.nombre,
          categoria: i.categoria,
          g: i.cuenta && i.gramos !== null ? Math.round((gramos[k] ?? i.gramos) / p.raciones) : null,
          macro: i.macro,
        })),
      },
    ]
  })
}

/**
 * Lo cocinado aguanta 3–4 días en la nevera (FoodSafety.gov, USDA, revisado en 2023; decisión 2026-11-09): se avisa a
 * partir del cuarto día. Arroz, pasta y legumbres, mejor antes (unos 2 días, según fuentes de consumo españolas).
 */
export const DIAS_NEVERA = 3

/**
 * De las comidas para las que cocinas (`fecha|comida`), las que caen más de 3 días después de cocinar: no aguantan en la
 * nevera y se hacen al momento ese día (sin congelador; usuario, 2026-11-18).
 */
export function pasanDeLaNevera(fecha: string, para: readonly string[]): string[] {
  const dia = (iso: string) => new Date(`${iso}T12:00:00`).getTime() / 86_400_000
  return para.filter((k) => dia(k.split('|')[0]) - dia(fecha) > DIAS_NEVERA)
}
