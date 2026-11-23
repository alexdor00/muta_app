// Lo del Plan (usuario, 2026-11-18): cómo se repiten tus menús (por días, con su largo, o según el entreno), el menú de
// un día concreto y tus días libres, el nombre y la hora de cada comida, para cuántas personas cocinas y lo que no quieres.
// Todo lo cambias tú; aquí solo se calcula.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { COMIDAS, type ComidaId } from './food.ts'
import {
  diaDelCicloDe,
  diaSemana,
  menuDelDia,
  type CicloMenus,
  type ExtraMenu,
  type MenuPlan,
  type MenuSemanal,
} from './menu.ts'
import { HORA_COMIDA } from './menuCalendar.ts'

/** Lo más que dura el ciclo de tus menús (cuatro semanas). */
export const MAX_DIAS_CICLO = 28
/** Lo que dura el ciclo «según el entreno» (dos semanas: así se alternan los menús de una semana a otra). */
const DIAS_POR_TIPO = 14
/** Para cuántas personas cocinas, como mucho. */
export const MAX_PERSONAS = 8

/** El nombre de una comida: el tuyo o el de serie. */
export function nombreDeComida(m: MenuSemanal, c: ComidaId): string {
  return m.comidas?.[c]?.nombre?.trim() || (COMIDAS.find((x) => x.id === c)?.nombre ?? c)
}

/** La hora de una comida: la tuya o la de serie (la del aviso y la que ordena lo que cubre cada vez que cocinas). */
export const horaDeComida = (m: MenuSemanal, c: ComidaId): string => m.comidas?.[c]?.hora ?? HORA_COMIDA[c]

/** Cambia el nombre o la hora de una comida (vacío: vuelve el de serie). */
export function conComida(
  m: MenuSemanal,
  c: ComidaId,
  cambio: { nombre?: string; hora?: string },
): MenuSemanal {
  const antes = m.comidas?.[c] ?? {}
  const nueva = { ...antes, ...cambio }
  if (!nueva.nombre?.trim()) delete nueva.nombre
  if (!nueva.hora) delete nueva.hora
  return { ...m, comidas: { ...m.comidas, [c]: nueva } }
}

/** Otro menú solo un día (null: vuelve el de tu ciclo). Se olvidan los días de hace más de una semana. */
export function conMenuEseDia(m: MenuSemanal, fecha: string, menu: string | null): MenuSemanal {
  const porDia = Object.fromEntries(
    Object.entries(m.porDia ?? {}).filter(([f]) => f !== fecha && daysBetween(f, fecha) <= 7),
  )
  if (menu) porDia[fecha] = menu
  return { ...m, porDia }
}

/** Día libre: ese día no sigues el menú ni se cocina ni se compra para él. */
export function conDiaLibre(m: MenuSemanal, fecha: string, libre: boolean): MenuSemanal {
  const libres = (m.libres ?? []).filter((f) => f !== fecha && daysBetween(f, fecha) <= 7)
  return { ...m, libres: libre ? [...libres, fecha].sort() : libres }
}

/** Para cuántas personas cocinas (de 1 a MAX_PERSONAS). */
export const conPersonas = (m: MenuSemanal, n: number): MenuSemanal => ({
  ...m,
  personas: Math.min(MAX_PERSONAS, Math.max(1, Math.round(n))),
})

/** Lo que no quieres comer (sin repetidos ni vacíos). */
export const conNoQuiero = (m: MenuSemanal, xs: readonly string[]): MenuSemanal => ({
  ...m,
  noQuiero: [...new Set(xs.map((x) => x.trim()).filter(Boolean))],
})

/** ¿Lleva un plato algo que no quieres? (por el nombre de sus ingredientes, sin mayúsculas ni tildes). */
export function llevaLoQueNoQuieres(
  m: MenuSemanal,
  ingredientes: readonly { nombre: string }[],
): string | null {
  const sin = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
  for (const no of m.noQuiero ?? []) if (ingredientes.some((i) => sin(i.nombre).includes(sin(no)))) return no
  return null
}

// --- Cómo se repiten tus menús ---

/** Tu ciclo de ahora: el que tienes o, sin él, tu semana de lunes a domingo (empezando el lunes de esta semana). */
export function cicloDe(m: MenuSemanal, hoy: string): CicloMenus {
  if (m.ciclo?.menus.length) return m.ciclo
  const lunes = addDays(hoy, -diaSemana(hoy))
  return {
    menus: Array.from({ length: 7 }, (_, i) => menuDelDia(m, addDays(lunes, i))?.id ?? 'A'),
    inicio: lunes,
  }
}

/** Con este ciclo (deja «según el entreno»). */
const conCiclo = (m: MenuSemanal, ciclo: CicloMenus): MenuSemanal => ({
  ...m,
  ciclo,
  porTipo: undefined,
  diasPorMenu: undefined,
})

/** Cambia cuántos días dura el ciclo: si crece, repite desde el principio; si mengua, quita los últimos. */
export function conLargo(m: MenuSemanal, n: number, hoy: string): MenuSemanal {
  const c = cicloDe(m, hoy)
  const largo = Math.min(MAX_DIAS_CICLO, Math.max(1, Math.round(n)))
  const menus = Array.from({ length: largo }, (_, i) => c.menus[i % c.menus.length])
  const cocinar = c.cocinar?.filter((d) => d <= largo)
  return conCiclo(m, { menus, inicio: c.inicio, ...(cocinar?.length ? { cocinar } : {}) })
}

/** El menú de un día del ciclo (1 = el primero). */
export function conMenuEnCiclo(m: MenuSemanal, dia: number, menu: string, hoy: string): MenuSemanal {
  const c = cicloDe(m, hoy)
  return conCiclo(m, { ...c, menus: c.menus.map((x, i) => (i === dia - 1 ? menu : x)) })
}

/** Si se cocina un día del ciclo (los días de cocinar de tu dieta). */
export function conCocinarEnCiclo(m: MenuSemanal, dia: number, si: boolean, hoy: string): MenuSemanal {
  const c = cicloDe(m, hoy)
  const cocinar = [...new Set([...(c.cocinar ?? []).filter((d) => d !== dia), ...(si ? [dia] : [])])].sort(
    (a, b) => a - b,
  )
  return conCiclo(m, cocinar.length ? { ...c, cocinar } : { menus: c.menus, inicio: c.inicio })
}

/** Que hoy sea un día concreto del ciclo (al cargar una dieta, o si te descuadras). */
export function conHoyEsElDia(m: MenuSemanal, dia: number, hoy: string): MenuSemanal {
  const c = cicloDe(m, hoy)
  return { ...m, ciclo: { ...c, inicio: addDays(hoy, -(dia - 1)) } }
}

/** El día del ciclo de hoy (1 = el primero). */
export const diaDeHoy = (m: MenuSemanal, hoy: string) => diaDelCicloDe(cicloDe(m, hoy), hoy)

/**
 * «Según el entreno»: un menú para los días de entreno y otro para los de descanso (si pones varios, se alternan), con tu
 * rutina de ahora. Queda como un ciclo de dos semanas desde `desde`; se rehace cada vez que lo aplicas.
 */
export function conPorTipo(
  m: MenuSemanal,
  porTipo: { entreno: string[]; descanso: string[] },
  desde: string,
  tipoDe: (fecha: string) => 'entreno' | 'descanso',
): MenuSemanal {
  const de = (t: 'entreno' | 'descanso') => {
    const xs = porTipo[t].length ? porTipo[t] : porTipo[t === 'entreno' ? 'descanso' : 'entreno']
    return xs.length ? xs : [m.menus[0]?.id ?? 'A']
  }
  const vistos = { entreno: 0, descanso: 0 }
  const menus = Array.from({ length: DIAS_POR_TIPO }, (_, i) => {
    const t = tipoDe(addDays(desde, i))
    const xs = de(t)
    return xs[vistos[t]++ % xs.length]
  })
  return { ...m, ciclo: { menus, inicio: desde }, porTipo, diasPorMenu: undefined }
}

/** Las cantidades para todos los que coméis (la compra): lo tuyo por el número de personas. */
export function porPersonas<T extends { lista: { g: number | null }[] }>(rs: readonly T[], n: number): T[] {
  if (n === 1) return [...rs]
  return rs.map((r) => ({
    ...r,
    lista: r.lista.map((i) => ({ ...i, g: i.g === null ? null : Math.round(i.g * n) })),
  }))
}

// --- Una comida de un menú ---

/** ¿Va igual en todos tus menús? */
export const esComun = (m: MenuSemanal, c: ComidaId) => !!m.comunes?.includes(c)

/**
 * «En todos los menús»: al encenderlo, lo de esta comida en este menú pasa a todos y, desde entonces, se cambia una vez;
 * al apagarlo, cada menú se queda con lo que tiene y se cambia por separado.
 */
export function conComun(m: MenuSemanal, menu: string, c: ComidaId, si: boolean): MenuSemanal {
  const comunes = (m.comunes ?? []).filter((x) => x !== c)
  if (!si) return { ...m, comunes }
  const de = m.menus.find((x) => x.id === menu)
  if (!de) return m
  return {
    ...m,
    comunes: [...comunes, c],
    menus: m.menus.map((x) => {
      const platos = { ...x.platos }
      if (de.platos[c]) platos[c] = de.platos[c]
      else delete platos[c]
      return { ...x, platos, extras: { ...x.extras, [c]: [...(de.extras?.[c] ?? [])] } }
    }),
  }
}

/** Qué días va una comida: todos, o solo los de entreno o de descanso (lo que lleva todo). */
export function diasDeComida(m: MenuSemanal, menu: string, c: ComidaId): 'todos' | 'entreno' | 'descanso' {
  const x = m.menus.find((k) => k.id === menu)
  const xs = x?.extras?.[c] ?? []
  if (!x || x.platos[c] || !xs.length) return 'todos'
  const solo = xs[0].solo
  return solo && xs.every((e) => e.solo === solo) ? solo : 'todos'
}

/**
 * Que una comida vaya solo los días de entreno o de descanso (o todos). Su plato pasa a ir como una ración más (con los
 * macros de `racion`), porque lo que va solo unos días no se ajusta a lo que te falta.
 */
export function conDiasDeComida(
  m: MenuSemanal,
  menu: string,
  c: ComidaId,
  dias: 'todos' | 'entreno' | 'descanso',
  racion: (platoId: string) => ExtraMenu | null,
): MenuSemanal {
  const solo = dias === 'todos' ? undefined : dias
  return {
    ...m,
    menus: m.menus.map((x) => {
      if (x.id !== menu && !esComun(m, c)) return x
      const platos = { ...x.platos }
      const delPlato = solo && platos[c] ? racion(platos[c]!) : null
      if (delPlato) delete platos[c]
      const xs = [...(delPlato ? [delPlato] : []), ...(x.extras?.[c] ?? [])].map((e) => {
        const sin: ExtraMenu = { ...e }
        delete sin.solo
        return solo ? { ...sin, solo } : sin
      })
      return { ...x, platos, extras: { ...x.extras, [c]: xs } }
    }),
  }
}

/**
 * El plato de una comida los días de descanso (usuario, 2026-11-19: «de forma predeterminada los mismos platos, pero que
 * puedas cambiarlo completamente»). El mismo que en entreno, o null, deja el de siempre.
 */
export function conPlatoDescanso(
  m: MenuSemanal,
  menu: string,
  comida: ComidaId,
  plato: string | null,
): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) => {
      if (x.id !== menu && !m.comunes?.includes(comida)) return x
      const descanso = { ...x.descanso }
      if (plato && plato !== x.platos[comida]) descanso[comida] = plato
      else delete descanso[comida]
      return { ...x, descanso: Object.keys(descanso).length ? descanso : undefined }
    }),
  }
}

/**
 * Tu dieta (usuario, 2026-11-19): tocar un día de la semana le pone este menú todas las semanas. La semana de ahora
 * (sin los cambios sueltos) pasa a ser la fija; ese día pierde su cambio suelto y se deja el ciclo y «según el entreno».
 */
export function conDiaFijo(m: MenuSemanal, fecha: string, menu: string, hoy: string): MenuSemanal {
  const fija = conSemanaFija(m, hoy)
  const semana = [...fija.semana]
  semana[diaSemana(fecha)] = menu
  const porDia = Object.fromEntries(Object.entries(m.porDia ?? {}).filter(([f]) => f !== fecha))
  return { ...fija, semana, porDia }
}

/**
 * «Por semana» (usuario, 2026-11-19): la semana de ahora (sin los cambios sueltos) pasa a ser la fija, cada día con su
 * menú todas las semanas; se dejan el ciclo y «según el entreno».
 */
export function conSemanaFija(m: MenuSemanal, hoy: string): MenuSemanal {
  const lunes = addDays(hoy, -diaSemana(hoy))
  const base = { ...m, porDia: undefined }
  const semana = Array.from(
    { length: 7 },
    (_, i) => menuDelDia(base, addDays(lunes, i))?.id ?? m.semana[i] ?? m.menus[0]?.id ?? 'A',
  )
  return { ...m, semana, reparto: 'elegidos', ciclo: undefined, porTipo: undefined, diasPorMenu: undefined }
}

/** ¿Lleva algún plato, de entreno o de descanso? (un menú con platos solo para descansar también cuenta). */
export const tienePlatos = (x: MenuPlan) =>
  Object.keys(x.platos).length + Object.keys(x.descanso ?? {}).length > 0
