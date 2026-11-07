// Tus menús: de 1 a 7 (A, B, C…), cada uno con un plato por comida, y tu semana (qué menú va cada día, de lunes a
// domingo: seguidos o elegidos por ti). Lo que comes un día sale del menú de ese día; cuándo cocinas cada plato (un día,
// a una hora, para varias comidas), el día de la compra y tus avisos. De aquí salen lo de hoy, la compra y el .ics.
import { addDays } from '../../../shared/lib/format.ts'
import { COMIDAS, sumar, type ComidaId, type Macros } from './food.ts'
import type { Plato } from './recipes.ts'

/** Un menú: su nombre y el plato de cada comida (las que no tiene, sin plato). */
export type MenuPlan = {
  id: string
  nombre: string
  platos: Partial<Record<ComidaId, string>>
  /** Las comidas que van con los gramos de la receta (las demás, ajustadas a tu objetivo). */
  fijos?: ComidaId[]
}

/** Un plato que cocinas un día, a una hora, para varias comidas (fecha|comida). */
export type Cocinado = { id: string; plato: string; fecha: string; hora: string; para: string[] }

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
  /** El menú de cada día de la semana (0 = lunes). */
  semana: string[]
  /** Seguidos: A B C A B C A; elegidos: los pones tú. */
  reparto: 'seguidos' | 'elegidos'
  cocinados: Cocinado[]
  compraEl: { fecha: string; hora: string } | null
  avisos: Avisos
  /** Propuestas a las que dijiste «Ahora no». */
  descartadas: string[]
  hechos: Hecho[]
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
  }
}

/** Lo guardado con la forma de antes (huecos por día) no se puede leer: se empieza de nuevo. */
export function leerMenu(x: unknown): MenuSemanal {
  const m = x as Partial<MenuSemanal> | null
  if (!m || !Array.isArray(m.menus) || !m.menus.length || !Array.isArray(m.semana)) return menuVacio()
  return { ...menuVacio(), ...m } as MenuSemanal
}

export const clave = (fecha: string, comida: ComidaId) => `${fecha}|${comida}`

/** El día de la semana de una fecha (0 = lunes). */
export function diaSemana(fecha: string): number {
  return (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
}

export const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const seguidos = (ids: readonly string[]) => Array.from({ length: 7 }, (_, i) => ids[i % ids.length])

/** El menú de un día. */
export function menuDelDia(m: MenuSemanal, fecha: string): MenuPlan | null {
  return m.menus.find((x) => x.id === m.semana[diaSemana(fecha)]) ?? m.menus[0] ?? null
}

/** Deja estos menús y rehace la semana (seguidos) o cambia los días de los que ya no están. */
function conMenus(m: MenuSemanal, menus: MenuPlan[]): MenuSemanal {
  const ids = menus.map((x) => x.id)
  const semana =
    m.reparto === 'seguidos' ? seguidos(ids) : m.semana.map((d) => (ids.includes(d) ? d : ids[0]))
  return { ...m, menus, semana }
}

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
  return { ...m, reparto, semana: reparto === 'seguidos' ? seguidos(m.menus.map((x) => x.id)) : m.semana }
}

/** Pone un menú en un día de la semana (y el reparto pasa a «elegidos»). */
export function conDia(m: MenuSemanal, dia: number, menu: string): MenuSemanal {
  return { ...m, reparto: 'elegidos', semana: m.semana.map((d, i) => (i === dia ? menu : d)) }
}

/** Pone o quita el plato de una comida de un menú. */
export function conPlato(m: MenuSemanal, menu: string, comida: ComidaId, plato: string | null): MenuSemanal {
  return {
    ...m,
    menus: m.menus.map((x) => {
      if (x.id !== menu) return x
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
  return conMenus(m, [...m.menus, { id: letra, nombre: `Menú ${letra}`, platos: { ...origen.platos } }])
}

/** Quita un menú (siempre queda uno). */
export function sinMenu(m: MenuSemanal, menu: string): MenuSemanal {
  if (m.menus.length <= 1) return m
  return conMenus(
    m,
    m.menus.filter((x) => x.id !== menu),
  )
}

/** Lo que comes en una comida de un día (null si su menú no tiene plato ahí). */
export function huecoDe(m: MenuSemanal, fecha: string, comida: ComidaId): Hueco | null {
  const menu = menuDelDia(m, fecha)
  const plato = menu?.platos[comida]
  if (!menu || !plato) return null
  const k = clave(fecha, comida)
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

/** Lo que suma un día con tu menú (`totalDe`: lo de cada comida). */
export function totalDelDia(m: MenuSemanal, fecha: string, totalDe: (h: Hueco) => Macros | null): Macros {
  return sumar(
    huecosDelDia(m, fecha).flatMap((h) => {
      const t = totalDe(h)
      return t ? [t] : []
    }),
  )
}

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

/** Los platos de tu menú en unos días, con sus ingredientes en gramos (lo que pide la lista de la compra). */
export function recetasDelMenu(
  m: MenuSemanal,
  fechas: readonly string[],
  platoDe: (id: string) => Plato | null,
  gramosDe: GramosDe,
): {
  id: string
  nombre: string
  deMenu: string
  lista: { alimentoId: string | null; nombre: string; categoria: string; g: number | null }[]
}[] {
  const nombreDe = (id: string) => m.menus.find((x) => x.id === id)?.nombre ?? `Menú ${id}`
  return fechas.flatMap((f) =>
    huecosDelDia(m, f).flatMap((h) => {
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
          })),
        },
      ]
    }),
  )
}

// --- Calendario (.ics): lo único que avisa a una hora con la app cerrada (la app no tiene servidor) ---

const HORA_COMIDA: Record<ComidaId, string> = {
  desayuno: '08:00',
  comida: '14:00',
  merienda: '17:30',
  cena: '21:00',
}

const ics = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const fechaIcs = (fecha: string, hora: string) => `${fecha.replace(/-/g, '')}T${hora.replace(':', '')}00`

/** Un archivo de calendario con tus horas de estos días (y su alarma antes). Las horas de las comidas son sugeridas. */
export function calendarioDelMenu(
  m: MenuSemanal,
  fechas: readonly string[],
  nombreDe: (platoId: string) => string,
  sello: string,
): string {
  const eventos: { uid: string; inicio: string; titulo: string; detalle: string }[] = []
  const a = m.avisos
  if (a.compra && m.compraEl && fechas.includes(m.compraEl.fecha))
    eventos.push({
      uid: `compra-${m.compraEl.fecha}`,
      inicio: fechaIcs(m.compraEl.fecha, m.compraEl.hora),
      titulo: 'Hacer la compra',
      detalle: 'La lista está en MUTA · Comida · La compra',
    })
  if (a.cocinar)
    for (const c of m.cocinados)
      if (fechas.includes(c.fecha))
        eventos.push({
          uid: `cocinar-${c.id}`,
          inicio: fechaIcs(c.fecha, c.hora),
          titulo: `Cocinar: ${nombreDe(c.plato)}`,
          detalle: `${c.para.length} ${c.para.length === 1 ? 'ración' : 'raciones'}. Los gramos están en MUTA.`,
        })
  if (a.comidas)
    for (const f of fechas)
      for (const h of huecosDelDia(m, f))
        eventos.push({
          uid: `comida-${h.fecha}-${h.comida}`,
          inicio: fechaIcs(h.fecha, HORA_COMIDA[h.comida]),
          titulo: `${COMIDAS.find((c) => c.id === h.comida)?.nombre ?? ''}: ${nombreDe(h.plato)}`,
          detalle: 'Apúntalo en MUTA al comerlo.',
        })
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MUTA//Comida//ES',
    ...eventos.flatMap((e) => [
      'BEGIN:VEVENT',
      `UID:${e.uid}@muta`,
      `DTSTAMP:${sello}`,
      `DTSTART:${e.inicio}`,
      'DURATION:PT30M',
      `SUMMARY:${ics(e.titulo)}`,
      `DESCRIPTION:${ics(e.detalle)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${ics(e.titulo)}`,
      `TRIGGER:-PT${a.antesMin}M`,
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  return lineas.join('\r\n') + '\r\n'
}
