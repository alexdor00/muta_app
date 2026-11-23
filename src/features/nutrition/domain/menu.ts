// Tus menús: de 1 a 7 (A, B, C…), cada uno con un plato por comida, y tu semana (qué menú va cada día, de lunes a
// domingo: seguidos o elegidos por ti). Lo que comes un día sale del menú de ese día; cuándo cocinas cada plato (un día,
// a una hora, para varias comidas), el día de la compra y tus avisos. De aquí salen lo de hoy, la compra y el .ics.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { COMIDAS, type ComidaId, type Macros } from './food.ts'
import { leerPiloto, type Piloto } from './autopilot.ts'
import type { ComoComes } from './fit.ts'

/** Un menú: su nombre y el plato de cada comida (las que no tiene, sin plato). */
export type MenuPlan = {
  id: string
  nombre: string
  platos: Partial<Record<ComidaId, string>>
  descanso?: Partial<Record<ComidaId, string>> // los días de descanso, otro plato; sin él, el mismo (2026-11-19)
  /** Las comidas que van con los gramos de la receta (las demás, ajustadas a tu objetivo). */
  fijos?: ComidaId[]
  /** Lo que va además del plato en cada comida: una fruta, un yogur… (usuario, 2026-11-17). */
  extras?: Partial<Record<ComidaId, ExtraMenu[]>>
}

/**
 * Lo que va además del plato: un alimento con sus gramos (los macros, por 100 g, para no depender de la base) u otro plato
 * del recetario (`platoId`: una ración, con los macros de esa ración).
 */
export type ExtraMenu = Macros & {
  alimentoId: string | null
  platoId?: string
  nombre: string
  categoria: string
  gramos: number
  /** Solo los días de entreno (el preentreno de una dieta) o solo los de descanso. */
  solo?: 'entreno' | 'descanso'
}

/**
 * Tus menús en un ciclo (usuario, 2026-11-17: «que no se descuadre cada semana»): el menú de cada día del ciclo (A A B B C
 * C), desde qué día cuenta y, si lo dice tu dieta, los días del ciclo en que se cocina. Manda sobre `semana`.
 */
export type CicloMenus = { menus: string[]; inicio: string; cocinar?: number[] }

/** Un plato que cocinas un día, a una hora, para varias comidas (fecha|comida); `hecho`, si ya lo cocinaste. */
export type Cocinado = {
  id: string
  plato: string
  fecha: string
  hora: string
  para: string[]
  hecho?: boolean
}

/** Un cambio de un menú (lo que propone el nutricionista), para deshacerlo. */
export type CambioMenu = { menu: string; comida: ComidaId; plato: string | null }

export type Hecho = {
  id: string
  fecha: string
  titulo: string
  antes: CambioMenu[]
  despues: CambioMenu[]
  estado: 'aplicado' | 'deshecho'
}

export type Avisos = { cocinar: boolean; compra: boolean; comidas: boolean; antesMin: number }

export type MenuSemanal = {
  id: 'menu'
  target: 'nutricion'
  menus: MenuPlan[]
  /** Lo de «Hoy toca» que quitaste con la «×» (cocinar, compra), solo ese día (usuario, 2026-11-19). */
  quitadoHoy?: { fecha: string; ids: string[] }
  semana: string[] // el menú de cada día de la semana (0 = lunes)
  reparto: 'seguidos' | 'elegidos' // seguidos: A B C A B C A; elegidos: los pones tú
  /** Con «seguidos», cuántos días seguidos va cada menú (A A B B C C A con 2; usuario, 2026-11-17). Sin decir, 1. */
  diasPorMenu?: number
  /** Tus menús en un ciclo que no mira el día de la semana (ver `CicloMenus`); sin él, `semana`. */
  ciclo?: CicloMenus
  /** Cómo sueles comer: cómo se reparte tu objetivo entre las comidas (sin elegir, repartido; usuario, 2026-11-17). */
  comoComes?: ComoComes
  cocinados: Cocinado[]
  compraEl: { fecha: string; hora: string } | null
  avisos: Avisos
  descartadas: string[] // las propuestas a las que dijiste «Ahora no»
  hechos: Hecho[]
  /** Las comidas de un día en que quitaste el plato del menú (solo ese día): `fecha|comida`. */
  sinPlato: string[]
  /** El plato cambiado en una comida de un día, solo ese día (`fecha|comida` → plato; usuario, 2026-11-17). */
  cambiados: Record<string, string>
  /** Tu semana resuelta: el día de la compra y cómo cocinas (null: sin piloto). Ver domain/autopilot.ts. */
  piloto: Piloto | null
  /** Plan (usuario, 2026-11-18; ver domain/menuPlan.ts): el menú de un día concreto (fecha → menú) y tus días libres. */
  porDia?: Record<string, string>
  libres?: string[]
  /** El nombre y la hora de cada comida, si no son los de serie. */
  comidas?: Partial<Record<ComidaId, { nombre?: string; hora?: string }>>
  /** «Según el entreno»: los menús de tus días de entreno y de descanso (se alternan si hay varios). */
  porTipo?: { entreno: string[]; descanso: string[] }
  /** Para cuántas personas cocinas (la olla y la compra; lo que comes tú no cambia) y lo que no quieres comer. */
  personas?: number
  noQuiero?: string[]
  /** Las comidas iguales en todos tus menús (el batido): se cambian una vez y cambian en todos. */
  comunes?: ComidaId[]
}

/** Lo que comes en una comida de un día: el plato de su menú. */
export type Hueco = { fecha: string; comida: ComidaId; menu: string; plato: string; cocinado: string | null }

export const MAX_MENUS = 7
const LETRAS = 'ABCDEFG'

export function menuVacio(): MenuSemanal {
  return {
    id: 'menu',
    target: 'nutricion',
    menus: [{ id: 'A', nombre: 'Menú A', platos: {} }],
    semana: Array(7).fill('A'),
    reparto: 'seguidos',
    cocinados: [],
    compraEl: null,
    avisos: { cocinar: true, compra: true, comidas: false, antesMin: 30 },
    descartadas: [],
    hechos: [],
    sinPlato: [],
    cambiados: {},
    piloto: null,
  }
}

/**
 * Quita (o vuelve a poner) el plato del menú en una comida de un día, solo ese día: el menú no cambia. Se olvidan los
 * días ya pasados de hace más de una semana, para que la lista no crezca sin fin.
 */
export function conSinPlato(
  m: MenuSemanal,
  fecha: string,
  comida: ComidaId,
  quitar: boolean,
  hoyEs: string,
): MenuSemanal {
  const k = clave(fecha, comida)
  const desde = addDays(hoyEs, -7)
  const resto = m.sinPlato.filter((x) => x !== k && x.split('|')[0] >= desde)
  return { ...m, sinPlato: quitar ? [...resto, k] : resto }
}

/**
 * Cambia el plato de una comida de un día, solo ese día (null: vuelve al del menú). Se olvidan los días de hace más de
 * una semana.
 */
export function conCambioDelDia(
  m: MenuSemanal,
  fecha: string,
  comida: ComidaId,
  plato: string | null,
  hoyEs: string,
): MenuSemanal {
  const k = clave(fecha, comida)
  const desde = addDays(hoyEs, -7)
  const resto = Object.fromEntries(
    Object.entries(m.cambiados).filter(([x]) => x !== k && x.split('|')[0] >= desde),
  )
  return { ...m, cambiados: plato ? { ...resto, [k]: plato } : resto }
}

/** Lo guardado con la forma de antes (huecos por día) no se puede leer: se empieza de nuevo. */
export function leerMenu(x: unknown): MenuSemanal {
  const m = x as Partial<MenuSemanal> | null
  if (!m || !Array.isArray(m.menus) || !m.menus.length || !Array.isArray(m.semana)) return menuVacio()
  // Lo guardado antes de `sinPlato` no lo trae
  return {
    ...menuVacio(),
    ...m,
    sinPlato: Array.isArray(m.sinPlato) ? m.sinPlato : [],
    cambiados: m.cambiados && typeof m.cambiados === 'object' ? m.cambiados : {},
    piloto: leerPiloto(m.piloto),
    ciclo: leerCiclo(m.ciclo),
    porDia: m.porDia && typeof m.porDia === 'object' ? m.porDia : undefined,
    libres: Array.isArray(m.libres) ? m.libres.filter((f) => typeof f === 'string') : undefined,
  } as MenuSemanal
}

export const clave = (fecha: string, comida: ComidaId) => `${fecha}|${comida}`

/** El ciclo guardado, si se puede leer (si no, sin ciclo: va por semanas). */
function leerCiclo(x: unknown): CicloMenus | undefined {
  const c = x as Partial<CicloMenus> | null | undefined
  if (!c || !Array.isArray(c.menus) || !c.menus.length || typeof c.inicio !== 'string') return undefined
  const cocinar = Array.isArray(c.cocinar) ? c.cocinar.filter((n) => typeof n === 'number') : undefined
  return {
    menus: c.menus.filter((s) => typeof s === 'string'),
    inicio: c.inicio,
    ...(cocinar?.length ? { cocinar } : {}),
  }
}

/** El día de la semana de una fecha (0 = lunes). */
export function diaSemana(fecha: string): number {
  return (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
}

export const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const DIA_LARGO = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
/** Una letra por día, de lunes a domingo (la X, el miércoles, para no repetir la M). */
export const LETRA_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** La semana con los menús seguidos, cada uno `n` días (A A B B C C A con n = 2). */
const seguidos = (ids: readonly string[], n = 1) =>
  Array.from({ length: 7 }, (_, i) => ids[Math.floor(i / Math.max(1, n)) % ids.length])

/** El menú de un día. */
export function menuDelDia(m: MenuSemanal, fecha: string): MenuPlan | null {
  const id =
    m.porDia?.[fecha] ??
    (m.ciclo?.menus.length ? m.ciclo.menus[diaDelCicloDe(m.ciclo, fecha) - 1] : m.semana[diaSemana(fecha)])
  return m.menus.find((x) => x.id === id) ?? m.menus[0] ?? null
}

/** El día del ciclo de tus menús de una fecha (1 = el día que empieza). */
export function diaDelCicloDe(c: CicloMenus, fecha: string): number {
  const n = Math.max(1, c.menus.length)
  return (((daysBetween(c.inicio, fecha) % n) + n) % n) + 1
}

/** ¿Se cocina este día, según tu dieta? (los días del ciclo que diga `cocinar`). */
export const seCocinaEl = (c: CicloMenus, fecha: string) => !!c.cocinar?.includes(diaDelCicloDe(c, fecha))

/** Deja estos menús y rehace la semana (seguidos) o cambia los días de los que ya no están. */
function conMenus(m: MenuSemanal, menus: MenuPlan[]): MenuSemanal {
  const ids = menus.map((x) => x.id)
  const semana =
    m.reparto === 'seguidos'
      ? seguidos(ids, m.diasPorMenu)
      : m.semana.map((d) => (ids.includes(d) ? d : ids[0]))
  // En ciclo: con días por menú, se rehace con los menús de ahora (desde el mismo día); el de tu dieta, sin los que ya
  // no están
  const ciclo = m.ciclo
    ? m.diasPorMenu
      ? { ...m.ciclo, menus: enBloques(ids, m.diasPorMenu) }
      : { ...m.ciclo, menus: m.ciclo.menus.map((d) => (ids.includes(d) ? d : ids[0])) }
    : undefined
  return { ...m, menus, semana, ciclo }
}

/** Cada menú, `n` días seguidos, una vuelta: A A B B C C con n = 2. */
const enBloques = (ids: readonly string[], n: number) =>
  ids.flatMap((id) => Array(Math.max(1, n)).fill(id) as string[])

/** Cambia cuántos menús tienes (1 a 7): los nuevos, vacíos; quitar quita los últimos. */
export function conCuantos(m: MenuSemanal, n: number): MenuSemanal {
  const cuantos = Math.min(MAX_MENUS, Math.max(1, n))
  let menus = m.menus.slice(0, cuantos)
  for (const letra of LETRAS) {
    if (menus.length >= cuantos) break
    if (!menus.some((x) => x.id === letra))
      menus = [...menus, { id: letra, nombre: `Menú ${letra}`, platos: {} }]
  }
  return conMenus(m, menus)
}

export function conReparto(m: MenuSemanal, reparto: MenuSemanal['reparto']): MenuSemanal {
  return {
    ...m,
    reparto,
    semana:
      reparto === 'seguidos'
        ? seguidos(
            m.menus.map((x) => x.id),
            m.diasPorMenu,
          )
        : m.semana,
  }
}

/**
 * Cada menú, `n` días seguidos (1 a 7), en un ciclo que empieza `desde` (hoy): A A B B C C y vuelta a empezar, sin mirar
 * el día de la semana (usuario, 2026-11-17).
 */
export function conDiasPorMenu(m: MenuSemanal, n: number, desde: string): MenuSemanal {
  const dias = Math.min(7, Math.max(1, Math.round(n)))
  const ids = m.menus.map((x) => x.id)
  return {
    ...m,
    diasPorMenu: dias,
    reparto: 'seguidos',
    semana: seguidos(ids, dias),
    ciclo: { menus: enBloques(ids, dias), inicio: desde },
  }
}

/** Pone un menú en un día de la semana (y el reparto pasa a «elegidos»). */
export function conDia(m: MenuSemanal, dia: number, menu: string, hoy?: string): MenuSemanal {
  // Elegir el menú de un día de la semana deja el ciclo: la semana de ahora pasa a ser la tuya
  const base = m.ciclo && hoy ? menusDeLaSemana(m, hoy) : m.semana
  return {
    ...m,
    reparto: 'elegidos',
    ciclo: undefined,
    diasPorMenu: undefined,
    semana: base.map((d, i) => (i === dia ? menu : d)),
  }
}

/** El menú de cada día de esta semana (de lunes a domingo), con el ciclo si lo hay. */
export function menusDeLaSemana(m: MenuSemanal, hoy: string): string[] {
  const lunes = addDays(hoy, -diaSemana(hoy))
  return Array.from({ length: 7 }, (_, i) => menuDelDia(m, addDays(lunes, i))?.id ?? m.semana[i])
}

/** Pone o quita el plato de una comida de un menú. */
export function conPlato(m: MenuSemanal, menu: string, comida: ComidaId, plato: string | null): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) => {
      if (x.id !== menu && !m.comunes?.includes(comida)) return x
      const platos = { ...x.platos }
      if (plato) platos[comida] = plato
      else delete platos[comida]
      return { ...x, platos }
    }),
  }
}

/** Una comida de un menú, con los gramos de tu objetivo (ajustada) o los de la receta. */
export function conAjuste(m: MenuSemanal, menu: string, comida: ComidaId, ajustada: boolean): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) => {
      if (x.id !== menu) return x
      const fijos = (x.fijos ?? []).filter((c) => c !== comida)
      return { ...x, fijos: ajustada ? fijos : [...fijos, comida] }
    }),
  }
}

export function renombrado(m: MenuSemanal, menu: string, nombre: string): MenuSemanal {
  const n = nombre.trim()
  return n ? { ...m, menus: m.menus.map((x) => (x.id === menu ? { ...x, nombre: n } : x)) } : m
}

/** Un menú más, copia de otro (con la siguiente letra libre); null si ya hay 7. */
export function duplicado(m: MenuSemanal, menu: string): MenuSemanal | null {
  const origen = m.menus.find((x) => x.id === menu)
  const letra = [...LETRAS].find((l) => !m.menus.some((x) => x.id === l))
  if (!origen || !letra) return null
  return conMenus(m, [
    ...m.menus,
    { id: letra, nombre: `Menú ${letra}`, platos: { ...origen.platos }, extras: { ...origen.extras } },
  ])
}

/** Quita un menú (siempre queda uno). */
export function sinMenu(m: MenuSemanal, menu: string): MenuSemanal {
  if (m.menus.length <= 1) return m
  return conMenus(
    m,
    m.menus.filter((x) => x.id !== menu),
  )
}

/** ¿Día de descanso? Lo pone el estado al cargar (`conTiposDeDia`). Y los platos de un menú ese tipo de día. */
let esDescanso: (fecha: string) => boolean = () => false
export const conTiposDeDia = (f: (fecha: string) => boolean) => void (esDescanso = f)
export const platosDe = (x: MenuPlan, descanso: boolean) =>
  descanso && x.descanso ? { ...x.platos, ...x.descanso } : x.platos

/** Lo que comes en una comida de un día (null si su menú no tiene plato ahí). */
export function huecoDe(m: MenuSemanal, fecha: string, comida: ComidaId): Hueco | null {
  const menu = menuDelDia(m, fecha)
  const k = clave(fecha, comida)
  const plato = m.cambiados[k] ?? (menu && platosDe(menu, esDescanso(fecha))[comida])
  if (!menu || !plato || m.libres?.includes(fecha)) return null
  if (m.sinPlato.includes(k)) return null
  const cocinado = m.cocinados.find((c) => c.plato === plato && c.para.includes(k))
  return { fecha, comida, menu: menu.id, plato, cocinado: cocinado?.id ?? null }
}

/** Lo de un día, en el orden de las comidas. */
export function huecosDelDia(m: MenuSemanal, fecha: string): Hueco[] {
  return COMIDAS.flatMap((c) => {
    const h = huecoDe(m, fecha, c.id)
    return h ? [h] : []
  })
}

/** Los 7 días desde una fecha. */
export const semanaDesde = (desde: string) => Array.from({ length: 7 }, (_, i) => addDays(desde, i))

/** Los días (de 7 desde una fecha) en que va un menú. */
export function diasDelMenu(m: MenuSemanal, menu: string, desde: string): string[] {
  return semanaDesde(desde).filter((f) => menuDelDia(m, f)?.id === menu)
}

/** Guarda un cocinado (sustituye al que tenga el mismo id). */
export function conCocinado(m: MenuSemanal, c: Cocinado): MenuSemanal {
  return { ...m, cocinados: [...m.cocinados.filter((x) => x.id !== c.id), c] }
}

export function sinCocinado(m: MenuSemanal, id: string): MenuSemanal {
  return { ...m, cocinados: m.cocinados.filter((c) => c.id !== id) }
}
