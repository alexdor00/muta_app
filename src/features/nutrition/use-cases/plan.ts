// Lo que cambias en el Plan (usuario, 2026-11-18): un día (su menú, su tipo, día libre), cómo se repiten tus menús, cada
// comida (nombre y hora), para cuántas personas cocinas y lo que no quieres. Cada cambio devuelve cómo estaba tu menú,
// para «Deshacer» (con `volverA`).
import type { ComidaId } from '../domain/food.ts'
import { conDiasPorMenu, type ExtraMenu, type MenuSemanal } from '../domain/menu.ts'
import {
  conCocinarEnCiclo,
  conComida,
  conComun,
  conDiasDeComida,
  conDiaLibre,
  conDiaFijo,
  conSemanaFija,
  conMenuEnCiclo,
  conMenuEseDia,
  conNoQuiero,
  conPersonas,
} from '../domain/menuPlan.ts'
import { ajustes, dieta, hoy } from '../state/comida.ts'
import { menu, platoPorId, totalDePlato } from '../state/recetas.ts'
import { elegirTipo, tipoDeRutina } from './diet.ts'
import { guardarMenu } from './menu.ts'
import { guardarAjustes } from './nutritionStore.ts'

/** Guarda el menú con un cambio y devuelve cómo estaba. */
async function cambiar(hacer: (m: MenuSemanal) => MenuSemanal): Promise<MenuSemanal> {
  const antes = menu.value
  await guardarMenu(hacer(antes))
  return antes
}

export const menuEseDia = (fecha: string, id: string | null) => cambiar((m) => conMenuEseDia(m, fecha, id))
/** Tocar un día en Tu dieta: este menú ese día, todas las semanas. */
export const diaFijo = (fecha: string, id: string) => cambiar((m) => conDiaFijo(m, fecha, id, hoy.value))
/** «Por semana»: cada día con su menú, todas las semanas. */
export const porSemana = () => cambiar((m) => conSemanaFija(m, hoy.value))
export const diaLibre = (fecha: string, libre: boolean) => cambiar((m) => conDiaLibre(m, fecha, libre))
export const cambiarComida = (c: ComidaId, cambio: { nombre?: string; hora?: string }) =>
  cambiar((m) => conComida(m, c, cambio))
export const cambiarPersonas = (n: number) => cambiar((m) => conPersonas(m, n))
export const cambiarNoQuiero = (xs: readonly string[]) => cambiar((m) => conNoQuiero(m, xs))

export const menuEnCiclo = (dia: number, id: string) => cambiar((m) => conMenuEnCiclo(m, dia, id, hoy.value))
export const cocinarEnCiclo = (dia: number, si: boolean) =>
  cambiar((m) => conCocinarEnCiclo(m, dia, si, hoy.value))
/** Cada menú, `n` días seguidos desde hoy (A A B B…), sin «según el entreno» (usuario, 2026-11-19). */
export const cadaMenuDura = (n: number) =>
  cambiar((m) => ({ ...conDiasPorMenu(m, n, hoy.value), porTipo: undefined }))

/** Un día de entreno o de descanso solo ese día (null: lo que diga tu rutina). Con dieta, lo guarda ella. */
export async function tipoDelDia(fecha: string, tipo: 'entreno' | 'descanso' | null): Promise<void> {
  if (dieta.value) return tipo ? elegirTipo(fecha, tipo) : tipoDeRutina(fecha)
  const a = ajustes.value
  if (!a) return
  const resto = Object.fromEntries(Object.entries(a.tipoElegido ?? {}).filter(([f]) => f !== fecha))
  await guardarAjustes({ ...a, tipoElegido: tipo ? { ...resto, [fecha]: tipo } : resto })
}

/** «En todos los menús» para una comida (al encenderlo, lo de este menú pasa a todos). */
export const comidaComun = (menuId: string, c: ComidaId, si: boolean) =>
  cambiar((m) => conComun(m, menuId, c, si))

/** Una ración de un plato como algo más de una comida (con sus macros de una ración). */
function racionDe(id: string): ExtraMenu | null {
  const p = platoPorId(id)
  if (!p) return null
  // Como «Añadir algo más»: el total del plato es su ración
  const t = totalDePlato(p)
  return {
    alimentoId: null,
    platoId: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    gramos: 0,
    kcal: Math.round(t.kcal),
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
  }
}

/** Qué días va una comida de un menú: todos, solo los de entreno o solo los de descanso. */
export const diasDeLaComida = (menuId: string, c: ComidaId, dias: 'todos' | 'entreno' | 'descanso') =>
  cambiar((m) => conDiasDeComida(m, menuId, c, dias, racionDe))

/** No quieres seguir un menú: «Aún no tienes menú para hoy» no vuelve a salir (con false, vuelve). */
/** Quita de «Hoy toca» una cosa (cocinar o la compra) solo por hoy; devuelve lo de antes, para «Deshacer». */
export const quitarDeHoy = (fecha: string, id: string) =>
  cambiar((m) => ({
    ...m,
    quitadoHoy: { fecha, ids: [...(m.quitadoHoy?.fecha === fecha ? m.quitadoHoy.ids : []), id] },
  }))

export async function sinAvisoDeMenu(quitar: boolean): Promise<void> {
  const a = ajustes.value
  if (a) await guardarAjustes({ ...a, sinAvisoMenu: quitar })
}
