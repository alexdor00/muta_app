// Tus menús: cuántos, qué día va cada uno, el plato de cada comida, cuándo cocinas, el día de la compra, tus avisos (al
// calendario del móvil: la app no tiene servidor) y lo que propone tu nutricionista («Aplicar», «Ahora no», «Deshacer»).
import { getDb } from '../../../shared/data/db.ts'
import { platform } from '../../../shared/platform/index.ts'
import {
  calendarioDelMenu,
  clave,
  conCocinado,
  conCuantos,
  conAjuste,
  conDia,
  conPlato,
  conReparto,
  diaSemana,
  duplicado,
  huecosDelDia,
  renombrado,
  semanaDesde,
  sinCocinado,
  sinMenu,
  type Avisos,
  type CambioMenu,
  type Cocinado,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import type { PropuestaMenu } from '../domain/menuCoach.ts'
import { menu, platoPorId } from '../state/recetas.ts'
import { addDays } from '../../../shared/lib/format.ts'
import { menuDe } from '../domain/diet.ts'
import { COMIDAS, type ComidaId } from '../domain/food.ts'
import { platoDeReceta } from '../domain/recipes.ts'
import { dieta, hoy } from '../state/comida.ts'
import { guardarPlatosTuyos, ID_MENU } from './recipes.ts'
import { nuevoId } from '../../../shared/lib/id.ts'

async function guardar(m: MenuSemanal): Promise<void> {
  menu.value = m
  await (await getDb()).put('userContent', { ...m, id: ID_MENU })
}

/** Vuelve a como estaba (para «Deshacer»). */
export const volverA = (m: MenuSemanal) => guardar(m)

export const cuantosMenus = (n: number) => guardar(conCuantos(menu.value, n))
export const repartoDeMenus = (r: MenuSemanal['reparto']) => guardar(conReparto(menu.value, r))
export const menuEnDia = (dia: number, id: string) => guardar(conDia(menu.value, dia, id))
export const ajustarComida = (id: string, comida: ComidaId, ajustada: boolean) =>
  guardar(conAjuste(menu.value, id, comida, ajustada))
export const renombrarMenu = (id: string, nombre: string) => guardar(renombrado(menu.value, id, nombre))

/** Duplica un menú; false si ya tienes 7. */
export async function duplicarMenu(id: string): Promise<boolean> {
  const m = duplicado(menu.value, id)
  if (!m) return false
  await guardar(m)
  return true
}

/** Quita un menú. Devuelve cómo estaba todo (para «Deshacer»). */
export async function quitarMenu(id: string): Promise<MenuSemanal> {
  const antes = menu.value
  await guardar(sinMenu(antes, id))
  return antes
}

/** Pone (o quita, con null) el plato de una comida de un menú. Devuelve el que había. */
export async function ponerPlato(
  menuId: string,
  comida: ComidaId,
  platoId: string | null,
): Promise<string | null> {
  const antes = menu.value.menus.find((x) => x.id === menuId)?.platos[comida] ?? null
  await guardar(conPlato(menu.value, menuId, comida, platoId))
  return antes
}

/** Guarda cuándo cocinas un plato y para qué comidas (si no queda ninguna, se quita). */
export function guardarCocinado(c: Cocinado): Promise<void> {
  return guardar(c.para.length ? conCocinado(menu.value, c) : sinCocinado(menu.value, c.id))
}

export const quitarCocinado = (id: string) => guardar(sinCocinado(menu.value, id))

/** Un cocinado nuevo para una comida: ese día, a una hora sugerida, solo para ella. */
export function cocinadoNuevo(fecha: string, comida: ComidaId, platoId: string): Cocinado {
  return { id: nuevoId(), plato: platoId, fecha, hora: '18:00', para: [clave(fecha, comida)] }
}

/** Las comidas con ese plato en los 7 días desde una fecha (las que puede cubrir un cocinado). */
export function comidasDelPlato(platoId: string, desde: string): Hueco[] {
  return semanaDesde(desde).flatMap((f) => huecosDelDia(menu.value, f).filter((h) => h.plato === platoId))
}

export const diaDeCompra = (fecha: string, hora: string) =>
  guardar({ ...menu.value, compraEl: { fecha, hora } })
export const sinDiaDeCompra = () => guardar({ ...menu.value, compraEl: null })
export const cambiarAvisos = (a: Partial<Avisos>) =>
  guardar({ ...menu.value, avisos: { ...menu.value.avisos, ...a } })

/** Pasa tus horas de 7 días al calendario del móvil (archivo .ics con su alarma). */
export async function alCalendario(desde = hoy.value): Promise<'shared' | 'saved' | 'none'> {
  const sello = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z')
  const texto = calendarioDelMenu(
    menu.value,
    semanaDesde(desde),
    (id) => platoPorId(id)?.nombre ?? 'Plato',
    sello,
  )
  const archivo = new File([texto], 'muta-semana.ics', { type: 'text/calendar' })
  return platform.shareFile('Tu semana en MUTA', archivo)
}

// --- Tu nutricionista ---

const conCambios = (m: MenuSemanal, cambios: readonly CambioMenu[]) =>
  cambios.reduce((x, c) => conPlato(x, c.menu, c.comida, c.plato), m)

/** Aplica una propuesta y la deja en «Ya hecho» para deshacerla. */
export function aplicarPropuesta(p: PropuestaMenu): Promise<void> {
  const m = conCambios(menu.value, p.despues)
  const hecho = {
    id: nuevoId(),
    fecha: hoy.value,
    titulo: p.titulo,
    antes: p.antes,
    despues: p.despues,
    estado: 'aplicado' as const,
  }
  return guardar({ ...m, hechos: [hecho, ...m.hechos].slice(0, 20) })
}

export const ahoraNo = (p: PropuestaMenu) =>
  guardar({ ...menu.value, descartadas: [...menu.value.descartadas, p.id].slice(-100) })

/** Deshace lo aplicado: vuelven los platos de antes. */
export function deshacerHecho(id: string): Promise<void> {
  const hecho = menu.value.hechos.find((x) => x.id === id)
  if (!hecho || hecho.estado !== 'aplicado') return Promise.resolve()
  const m = conCambios(menu.value, hecho.antes)
  return guardar({
    ...m,
    hechos: m.hechos.map((x) => (x.id === id ? { ...x, estado: 'deshecho' as const } : x)),
  })
}

/**
 * Pasa los menús de tu dieta a tus menús: cada menú de la dieta, un menú tuyo (su primera receta de cada comida) y tu
 * semana como la de la dieta. Sus recetas pasan a tus platos. Devuelve cómo estaba (para «Deshacer»); null sin dieta.
 */
export async function menusDeTuDieta(): Promise<MenuSemanal | null> {
  const a = dieta.value
  if (!a) return null
  const antes = menu.value
  const d = a.dieta
  await guardarPlatosTuyos(
    d.recetas.map((r) => ({
      ...platoDeReceta(r),
      id: `dieta-${r.id}`,
      categoria: 'tuyos',
      origen: 'tuyo' as const,
    })),
  )
  const letras = 'ABCDEFG'
  const menus = d.menus.slice(0, 7).map((m, i) => ({
    id: letras[i],
    nombre: m.nombre,
    platos: Object.fromEntries(
      COMIDAS.flatMap(({ id: c }) => {
        const r =
          d.recetas.find((x) => x.comida === c && x.menu === m.id) ??
          d.recetas.find((x) => x.comida === c && !x.menu)
        return r ? [[c, `dieta-${r.id}`]] : []
      }),
    ),
  }))
  const lunes = addDays(hoy.value, -diaSemana(hoy.value))
  const semana = Array.from({ length: 7 }, (_, i) => {
    const k = d.menus.findIndex((m) => m.id === menuDe(d, a.inicio, addDays(lunes, i)).id)
    return letras[Math.max(0, Math.min(menus.length - 1, k))]
  })
  await guardar({ ...antes, menus, semana, reparto: 'elegidos' })
  return antes
}
