// Tus menús: cuántos, qué día va cada uno, el plato de cada comida, cuándo cocinas, el día de la compra, tus avisos (al
// calendario del móvil: la app no tiene servidor) y lo que propone tu nutricionista («Aplicar», «Ahora no», «Deshacer»).
import { getDb } from '../../../shared/data/db.ts'
import { platform } from '../../../shared/platform/index.ts'
import { calendarioDelMenu, type EventoExtra } from '../domain/menuCalendar.ts'
import {
  clave,
  conCambioDelDia,
  conCuantos,
  conAjuste,
  conDia,
  conPlato,
  huecoDe,
  conSinPlato,
  conReparto,
  duplicado,
  renombrado,
  semanaDesde,
  sinMenu,
  type Avisos,
  type CambioMenu,
  type Cocinado,
  type ExtraMenu,
  type MenuSemanal,
  MAX_MENUS,
} from '../domain/menu.ts'
import type { PropuestaMenu } from '../domain/menuCoach.ts'
import { conExtra, conGramosDeExtra, extrasDe, sinExtra } from '../domain/menuExtras.ts'
import { diasDeCompra, paraQueDias, piloto, platosDeTanda, tandas } from '../state/autopilot.ts'
import {
  gramosDeHueco,
  menu,
  menusDeLaSemana,
  platoPorId,
  platosQueQuieres,
  platosTuyos,
  repartoActual,
  editandoDescanso,
  platosDelMenu,
} from '../state/recetas.ts'
import { menuPropuesto, type ComoComes } from '../domain/fit.ts'
import { macrosDe, type ComidaId } from '../domain/food.ts'
import { menusDesdeDieta, platoDeReceta } from '../domain/dietaAMenus.ts'
import { dias, dieta, hoy, objetivoDelDia, tipoDe } from '../state/comida.ts'
import { anadir, devolver, quitar } from './foodLog.ts'
import { apuntarPlato, desapuntar, guardarPlatosTuyos, ID_MENU, platoApuntado } from './recipes.ts'
import { conPlatoDescanso } from '../domain/menuPlan.ts'
import { nuevoId } from '../../../shared/lib/id.ts'

async function guardar(m: MenuSemanal): Promise<void> {
  menu.value = m
  await (await getDb()).put('userContent', { ...m, id: ID_MENU })
}

/** Guarda tu menú tal cual (lo usa tu semana resuelta, que vive dentro). */
export const guardarMenu = guardar

/**
 * El tick de una comida con plato de tu menú: lo apunta con sus gramos de ese día o, si ya estaba, lo quita. Devuelve lo apuntado (para «Deshacer»); null si lo quitó.
 */
export async function tickDelMenu(
  fecha: string,
  comida: ComidaId,
  /** Solo el plato o solo una cosa de más (su número): cada una con su tick en tu día (usuario, 2026-11-20). */
  solo?: 'plato' | number,
): Promise<{ nombre: string; ids: string[] } | null> {
  const todo = solo === undefined
  const h = todo || solo === 'plato' ? huecoDe(menu.value, fecha, comida) : null
  const p = h ? platoPorId(h.plato, fecha) : null
  // Lo que va además (una fruta, un yogur) se apunta y se quita con el plato, o cada cosa con su tick
  const todas = extrasDe(menu.value, fecha, comida, tipoDe)
  const extras = todo ? todas : typeof solo === 'number' && todas[solo] ? [todas[solo]] : []
  if ((!h || !p) && !extras.length) return null
  const apuntes = (dias.value[fecha] ?? []).filter((a) => a.comida === comida)
  const hecho = p
    ? platoApuntado(p.id, comida, fecha)
    : extras.every((x) => apuntes.some((a) => esDeExtra(a, x)))
  if (hecho) {
    const deExtras = new Set(extras.flatMap((x) => (x.alimentoId ? [x.alimentoId] : [])))
    const platosExtra = new Set(extras.flatMap((x) => (x.platoId ? [x.platoId] : [])))
    const ids = (dias.value[fecha] ?? [])
      .filter(
        (a) =>
          a.comida === comida &&
          ((p && a.receta === p.id) ||
            (a.receta && platosExtra.has(a.receta)) ||
            (!a.receta && a.alimentoId && deExtras.has(a.alimentoId))),
      )
      .map((a) => a.id)
    await desapuntar(ids, fecha)
    return null
  }
  const ids = h && p ? await apuntarPlato(p, comida, gramosDeHueco(h, p), 1, fecha) : []
  for (const x of extras) {
    const otro = x.platoId ? platoPorId(x.platoId, fecha) : null
    if (otro) ids.push(...(await apuntarPlato(otro, comida, null, 1, fecha)))
    else if (!x.platoId) ids.push(await anadir(apunteDeExtra(x, comida), fecha))
  }
  return { nombre: p?.nombre ?? extras.map((x) => x.nombre).join(' y '), ids }
}

/** Un extra del menú como apunte. */
const apunteDeExtra = (x: ExtraMenu, comida: ComidaId) => ({
  comida,
  nombre: x.nombre,
  alimentoId: x.alimentoId,
  gramos: x.gramos,
  raciones: null,
  racion: null,
  ...macrosDe(x, x.gramos),
})

/** Si todo lo que va además del plato en esa comida ya está apuntado (las comidas que solo llevan extras). */
export function extrasApuntados(fecha: string, comida: ComidaId): boolean {
  const xs = extrasDe(menu.value, fecha, comida, tipoDe)
  const apuntes = (dias.value[fecha] ?? []).filter((a) => a.comida === comida)
  return xs.length > 0 && xs.every((x) => apuntes.some((a) => esDeExtra(a, x)))
}

/** Si un apunte es esa cosa de más del menú (su plato o su alimento). */
const esDeExtra = (a: { receta?: string | null; alimentoId?: string | null }, x: ExtraMenu) =>
  x.platoId ? a.receta === x.platoId : !a.receta && a.alimentoId === x.alimentoId

/** Lo de más de una comida que aún no apuntaste, con su número (para su tick en tu día). */
export function extrasPorApuntar(fecha: string, comida: ComidaId): { extra: ExtraMenu; i: number }[] {
  const apuntes = (dias.value[fecha] ?? []).filter((a) => a.comida === comida)
  return extrasDe(menu.value, fecha, comida, tipoDe)
    .map((extra, i) => ({ extra, i }))
    .filter(({ extra }) => !apuntes.some((a) => esDeExtra(a, extra)))
}

/** Cómo sueles comer (el reparto de tu objetivo entre comidas). Devuelve cómo estaba (para «Deshacer»). */
export async function cambiarComoComes(c: ComoComes): Promise<MenuSemanal> {
  const antes = menu.value
  await guardar({ ...antes, comoComes: c })
  return antes
}

/** Añade algo más (una fruta, un yogur…) a una comida de un menú. Devuelve cómo estaba (para «Deshacer»). */
export async function anadirExtra(menuId: string, comida: ComidaId, x: ExtraMenu): Promise<MenuSemanal> {
  const antes = menu.value
  await guardar(conExtra(antes, menuId, comida, x))
  return antes
}

/** Quita lo que va además en una comida de un menú. Devuelve cómo estaba (para «Deshacer»). */
export async function quitarExtra(menuId: string, comida: ComidaId, i: number): Promise<MenuSemanal> {
  const antes = menu.value
  await guardar(sinExtra(antes, menuId, comida, i))
  return antes
}

/** Cambia los gramos de lo que va además en una comida de un menú. Devuelve cómo estaba (para «Deshacer»). */
export async function gramosDeExtra(
  menuId: string,
  comida: ComidaId,
  i: number,
  gramos: number,
): Promise<MenuSemanal> {
  const antes = menu.value
  await guardar(conGramosDeExtra(antes, menuId, comida, i, gramos))
  return antes
}

/** Vuelve a como estaba (para «Deshacer»). */
export const volverA = (m: MenuSemanal) => guardar(m)

export const cuantosMenus = (n: number) => guardar(conCuantos(menu.value, n))
export const repartoDeMenus = (r: MenuSemanal['reparto']) => guardar(conReparto(menu.value, r))
export const menuEnDia = (dia: number, id: string) => guardar(conDia(menu.value, dia, id, hoy.value))
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
  const x = menu.value.menus.find((k) => k.id === menuId)
  const antes = (x && platosDelMenu(x)[comida]) ?? null
  // Mirando un día de descanso, el plato es solo de descanso (null: el mismo que en entreno)
  await guardar(
    editandoDescanso.value
      ? conPlatoDescanso(menu.value, menuId, comida, platoId)
      : conPlato(menu.value, menuId, comida, platoId),
  )
  return antes
}

/** Cambia el plato de una comida solo ese día (null: vuelve al de su menú). Devuelve cómo deshacerlo. */
export async function cambiarEseDia(
  fecha: string,
  comida: ComidaId,
  plato: string | null,
): Promise<() => Promise<void>> {
  const antes = menu.value.cambiados[clave(fecha, comida)] ?? null
  await guardar(conCambioDelDia(menu.value, fecha, comida, plato, hoy.value))
  return () => guardar(conCambioDelDia(menu.value, fecha, comida, antes, hoy.value))
}

/**
 * «Proponme un menú» (sugerido): un plato por comida que encaja con tu objetivo de hoy, en tu primer menú vacío (o en uno
 * nuevo). Devuelve el menú y cómo deshacerlo; null si no hay objetivo o platos.
 */
export async function proponerMenu(): Promise<{ menu: string; deshacer: () => Promise<void> } | null> {
  const o = objetivoDelDia(hoy.value)
  if (!o) return null
  const propuesto = menuPropuesto(platosQueQuieres.value, o, repartoActual.value)
  if (!Object.keys(propuesto).length) return null
  const antes = menu.value
  let m = antes
  let destino = m.menus.find((x) => !Object.keys(x.platos).length)
  if (!destino) {
    if (m.menus.length >= MAX_MENUS) return null
    m = conCuantos(m, m.menus.length + 1)
    destino = m.menus.at(-1)!
  }
  for (const [c, p] of Object.entries(propuesto)) m = conPlato(m, destino.id, c as ComidaId, p)
  await guardar(m)
  return { menu: destino.id, deshacer: () => guardar(antes) }
}

/** Quita el plato del menú de una comida solo ese día (o lo vuelve a poner, para «Deshacer»). */
export const sinPlatoEseDia = (fecha: string, comida: ComidaId, sinEl = true) =>
  guardar(conSinPlato(menu.value, fecha, comida, sinEl, hoy.value))

/** El nombre del plato de tu menú en una comida de un día (para el aviso al quitarlo); null si no lleva. */
export const platoEseDia = (fecha: string, comida: ComidaId) =>
  platoPorId(huecoDe(menu.value, fecha, comida)?.plato ?? '', fecha)?.nombre ?? null

/**
 * Quita el plato del menú de una comida, solo ese día (y su apunte, si ya lo apuntaste). Lo demás que apuntaste y lo de más
 * del menú se quedan (usuario, 2026-11-21). Devuelve cómo deshacerlo.
 */
export async function quitarDeEseDia(comida: ComidaId, fecha: string): Promise<() => Promise<void>> {
  const h = huecoDe(menu.value, fecha, comida)
  const ids = (dias.value[fecha] ?? [])
    .filter((a) => a.comida === comida && h && a.receta === h.plato)
    .map((a) => a.id)
  const teniaPlato = h !== null
  const quitados = ids.length ? await quitar(ids, fecha) : []
  if (teniaPlato) await sinPlatoEseDia(fecha, comida)
  return async () => {
    if (quitados.length) await devolver(quitados, fecha)
    if (teniaPlato) await sinPlatoEseDia(fecha, comida, false)
  }
}

/** Quita el plato de una comida de un menú. Devuelve cómo deshacerlo. */
export async function quitarDelMenu(menuId: string, comida: ComidaId): Promise<() => Promise<unknown>> {
  const antes = await ponerPlato(menuId, comida, null)
  return () => ponerPlato(menuId, comida, antes)
}

/** Marca lo que cocinas a la vez como cocinado (o no): lo mismo desde su hoja, desde tu día de Nutrición y desde Hoy. */
export function marcarCocinados(ids: readonly string[], hecho: boolean): Promise<void> {
  return guardar({
    ...menu.value,
    cocinados: menu.value.cocinados.map((c) => (ids.includes(c.id) ? { ...c, hecho } : c)),
  })
}

/** Cocinar aparte: cambia los platos que cocinas a la vez (quita los de antes, `ids`, y pone estos; vacío, los quita). */
export function guardarSesion(ids: readonly string[], nuevos: readonly Cocinado[]): Promise<void> {
  const resto = menu.value.cocinados.filter((c) => !ids.includes(c.id))
  return guardar({ ...menu.value, cocinados: [...resto, ...nuevos.filter((c) => c.para.length)] })
}

/** Un cocinado nuevo para una comida: ese día, a una hora sugerida, solo para ella. */
export function cocinadoNuevo(fecha: string, comida: ComidaId, platoId: string): Cocinado {
  return { id: nuevoId(), plato: platoId, fecha, hora: '18:00', para: [clave(fecha, comida)] }
}

export const cambiarAvisos = (a: Partial<Avisos>) =>
  guardar({ ...menu.value, avisos: { ...menu.value.avisos, ...a } })

/** Pasa tus horas de 7 días al calendario del móvil (archivo .ics con su alarma). */
export async function alCalendario(desde = hoy.value): Promise<'shared' | 'saved' | 'none'> {
  const sello = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z')
  const fechas = semanaDesde(desde)
  const nombreDe = (id: string) => platoPorId(id)?.nombre ?? 'Plato'
  // Tu semana resuelta: tus tandas y tu compra de cada semana
  const p = piloto.value
  const extra: EventoExtra[] = tandas.value
    .filter((t) => t.huecos.length)
    .map((t) => ({
      uid: `tanda-${t.fecha}`,
      tipo: 'cocinar' as const,
      fecha: t.fecha,
      hora: t.hora,
      titulo: `Cocinar ${paraQueDias(t)}`,
      detalle: `${platosDeTanda(t)
        .map((x) => `${nombreDe(x.plato)} ×${x.raciones}`)
        .join(', ')}. Los gramos y los pasos están en MUTA.`,
    }))
  if (p?.compra)
    for (const f of diasDeCompra(p, fechas, tandas.value))
      extra.push({
        uid: `compra-semana-${f}`,
        tipo: 'compra',
        fecha: f,
        hora: p.compra!.hora,
        titulo: 'Hacer la compra',
        detalle: 'La lista, con lo que ya tienes en casa, está en MUTA · Nutrición · Tu plan',
      })
  const texto = calendarioDelMenu(menu.value, fechas, nombreDe, sello, extra)
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
  const platoDe = (r: { id: string }) => `dieta-${r.id}`
  // Cada receta, un plato tuyo con sus gramos de entreno y de descanso
  await guardarPlatosTuyos([
    ...platosTuyos.value.filter((p) => !p.id.startsWith('dieta-')),
    ...d.recetas.map((r) => ({
      ...platoDeReceta(r),
      id: platoDe(r),
      categoria: 'tuyos',
      origen: 'tuyo' as const,
    })),
  ])
  const { menus, ciclo } = menusDesdeDieta(d, a.inicio, platoDe)
  const conCiclo: MenuSemanal = { ...antes, menus, ciclo, reparto: 'elegidos', diasPorMenu: undefined }
  await guardar({ ...conCiclo, semana: menusDeLaSemana(conCiclo, hoy.value) })
  return antes
}
