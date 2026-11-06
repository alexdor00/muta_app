// Tu menú: qué plato va en cada comida de cada día, cuándo cocinas cada uno (un día, a una hora, para varias comidas),
// el día de la compra y tus avisos. De aquí salen «Lo de hoy», la lista de la compra y el calendario (.ics).
import { addDays } from '../../../shared/lib/format.ts'
import { totalCon, type Valores } from './fit.ts'
import { COMIDAS, sumar, type ComidaId, type Macros } from './food.ts'
import type { Plato } from './recipes.ts'

/** Una comida de un día con su plato y, si se ajustó, sus gramos. */
export type Hueco = {
  fecha: string
  comida: ComidaId
  plato: string
  /** Gramos de cada ingrediente (los del ajuste); null, los del plato. */
  gramos: (number | null)[] | null
  /** El cocinado del que sale; null si se cocina ese día. */
  cocinado: string | null
}

/** Un plato que cocinas un día, a una hora, para varias comidas. */
export type Cocinado = { id: string; plato: string; fecha: string; hora: string; para: string[] }

/** Una propuesta del nutricionista que aplicaste (para deshacerla). */
export type Hecho = {
  id: string
  fecha: string
  titulo: string
  detalle: string
  antes: Hueco[]
  despues: Hueco[]
  estado: 'aplicado' | 'deshecho'
}

export type Avisos = { cocinar: boolean; compra: boolean; comidas: boolean; antesMin: number }

export type MenuSemanal = {
  id: 'menu'
  target: 'nutricion'
  huecos: Hueco[]
  cocinados: Cocinado[]
  /** El próximo día de la compra. */
  compraEl: { fecha: string; hora: string } | null
  avisos: Avisos
  /** Propuestas a las que dijiste «Ahora no». */
  descartadas: string[]
  hechos: Hecho[]
}

export function menuVacio(): MenuSemanal {
  return {
    id: 'menu',
    target: 'nutricion',
    huecos: [],
    cocinados: [],
    compraEl: null,
    avisos: { cocinar: true, compra: true, comidas: false, antesMin: 30 },
    descartadas: [],
    hechos: [],
  }
}

export const clave = (fecha: string, comida: ComidaId) => `${fecha}|${comida}`
const claveDe = (h: Pick<Hueco, 'fecha' | 'comida'>) => clave(h.fecha, h.comida)

export function huecoDe(menu: MenuSemanal, fecha: string, comida: ComidaId): Hueco | null {
  return menu.huecos.find((h) => h.fecha === fecha && h.comida === comida) ?? null
}

/** Los huecos de un día, en el orden de las comidas. */
export function huecosDelDia(menu: MenuSemanal, fecha: string): Hueco[] {
  const orden = COMIDAS.map((c) => c.id)
  return menu.huecos
    .filter((h) => h.fecha === fecha)
    .sort((x, y) => orden.indexOf(x.comida) - orden.indexOf(y.comida))
}

/** Pone (o cambia) el plato de una comida. Si cambia de plato, deja de salir de lo cocinado. */
export function conHueco(menu: MenuSemanal, h: Hueco): MenuSemanal {
  const antes = huecoDe(menu, h.fecha, h.comida)
  const cambia = antes && antes.plato !== h.plato
  const huecos = [
    ...menu.huecos.filter((x) => claveDe(x) !== claveDe(h)),
    cambia ? { ...h, cocinado: null } : h,
  ]
  const cocinados = cambia
    ? menu.cocinados
        .map((c) => ({ ...c, para: c.para.filter((k) => k !== claveDe(h)) }))
        .filter((c) => c.para.length)
    : menu.cocinados
  return { ...menu, huecos, cocinados }
}

export function sinHueco(menu: MenuSemanal, fecha: string, comida: ComidaId): MenuSemanal {
  const k = clave(fecha, comida)
  return {
    ...menu,
    huecos: menu.huecos.filter((x) => claveDe(x) !== k),
    cocinados: menu.cocinados
      .map((c) => ({ ...c, para: c.para.filter((x) => x !== k) }))
      .filter((c) => c.para.length),
  }
}

/** Guarda un cocinado y marca sus comidas (las que dejan de estar, vuelven a cocinarse ese día). */
export function conCocinado(menu: MenuSemanal, c: Cocinado): MenuSemanal {
  const cocinados = [...menu.cocinados.filter((x) => x.id !== c.id), c]
  const huecos = menu.huecos.map((h) => {
    const k = claveDe(h)
    if (c.para.includes(k)) return { ...h, cocinado: c.id }
    return h.cocinado === c.id ? { ...h, cocinado: null } : h
  })
  return { ...menu, cocinados, huecos }
}

export function sinCocinado(menu: MenuSemanal, id: string): MenuSemanal {
  return {
    ...menu,
    cocinados: menu.cocinados.filter((c) => c.id !== id),
    huecos: menu.huecos.map((h) => (h.cocinado === id ? { ...h, cocinado: null } : h)),
  }
}

/** Los 7 días desde una fecha. */
export const semanaDesde = (desde: string) => Array.from({ length: 7 }, (_, i) => addDays(desde, i))

/** Lo que lleva un hueco. */
export function totalDeHueco(h: Hueco, plato: Plato, valores: Valores = []): Macros {
  return totalCon(plato, h.gramos ?? plato.ingredientes.map((i) => i.gramos), valores)
}

/** Lo que suma un día con tu menú (solo lo que tiene plato). */
export function totalDelDia(
  menu: MenuSemanal,
  fecha: string,
  platoDe: (id: string) => Plato | null,
  valoresDe: (p: Plato) => Valores = () => [],
): Macros {
  return sumar(
    huecosDelDia(menu, fecha).flatMap((h) => {
      const p = platoDe(h.plato)
      return p ? [totalDeHueco(h, p, valoresDe(p))] : []
    }),
  )
}

/** Lo que compras o cocinas de una vez: gramos de cada ingrediente sumando las comidas (los que no tienen, sin cantidad). */
export function paraCocinar(
  menu: MenuSemanal,
  c: Cocinado,
  plato: Plato,
): { nombre: string; texto: string; gramos: number | null; macro: Plato['ingredientes'][number]['macro'] }[] {
  const huecos = menu.huecos.filter((h) => c.para.includes(claveDe(h)))
  return plato.ingredientes.map((i, k) => ({
    nombre: i.nombre,
    texto: i.texto,
    macro: i.macro,
    gramos:
      i.gramos === null || !i.cuenta
        ? null
        : Math.round(huecos.reduce((s, h) => s + (h.gramos?.[k] ?? i.gramos ?? 0), 0)),
  }))
}

/** Algo que toca hoy. */
export type Tarea =
  | { id: string; tipo: 'compra'; hora: string }
  | { id: string; tipo: 'cocinar'; hora: string; cocinado: Cocinado; raciones: number }
  | { id: string; tipo: 'comida'; hueco: Hueco; yaCocinado: boolean }

/** Lo de hoy: la compra y lo que cocinas (por hora) y después lo que comes, en el orden del día. */
export function loDeHoy(menu: MenuSemanal, fecha: string): Tarea[] {
  const conHora: Tarea[] = []
  if (menu.compraEl?.fecha === fecha) conHora.push({ id: 'compra', tipo: 'compra', hora: menu.compraEl.hora })
  for (const c of menu.cocinados)
    if (c.fecha === fecha)
      conHora.push({
        id: `cocinar-${c.id}`,
        tipo: 'cocinar',
        hora: c.hora,
        cocinado: c,
        raciones: c.para.length,
      })
  conHora.sort((x, y) => ('hora' in x && 'hora' in y ? x.hora.localeCompare(y.hora) : 0))
  const cocinadoAntes = (h: Hueco) => {
    const c = menu.cocinados.find((x) => x.id === h.cocinado)
    return !!c && c.fecha < fecha
  }
  const comidas: Tarea[] = huecosDelDia(menu, fecha).map((h) => ({
    id: `comida-${h.comida}`,
    tipo: 'comida',
    hueco: h,
    yaCocinado: cocinadoAntes(h),
  }))
  return [...conHora, ...comidas]
}

/** Las recetas del menú en unos días, con sus ingredientes en gramos (lo que pide la lista de la compra). */
export function recetasDelMenu(
  menu: MenuSemanal,
  fechas: readonly string[],
  platoDe: (id: string) => Plato | null,
): {
  id: string
  nombre: string
  lista: { alimentoId: string | null; nombre: string; categoria: string; g: number | null }[]
}[] {
  return menu.huecos
    .filter((h) => fechas.includes(h.fecha))
    .flatMap((h) => {
      const p = platoDe(h.plato)
      if (!p) return []
      const veces = 1 / p.raciones
      return [
        {
          id: p.id,
          nombre: p.nombre,
          lista: p.ingredientes.map((i, k) => ({
            alimentoId: i.alimentoId,
            nombre: i.nombre,
            categoria: i.categoria,
            g: i.cuenta && i.gramos !== null ? Math.round((h.gramos?.[k] ?? i.gramos) * veces) : null,
          })),
        },
      ]
    })
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

/** Un archivo de calendario con tus horas de esta semana (y su alarma antes). Las horas de las comidas son sugeridas. */
export function calendarioDelMenu(
  menu: MenuSemanal,
  fechas: readonly string[],
  nombreDe: (platoId: string) => string,
  sello: string,
): string {
  const eventos: { uid: string; inicio: string; titulo: string; detalle: string }[] = []
  const a = menu.avisos
  if (a.compra && menu.compraEl && fechas.includes(menu.compraEl.fecha))
    eventos.push({
      uid: `compra-${menu.compraEl.fecha}`,
      inicio: fechaIcs(menu.compraEl.fecha, menu.compraEl.hora),
      titulo: 'Hacer la compra',
      detalle: 'La lista está en MUTA · Comida · La compra',
    })
  if (a.cocinar)
    for (const c of menu.cocinados)
      if (fechas.includes(c.fecha))
        eventos.push({
          uid: `cocinar-${c.id}`,
          inicio: fechaIcs(c.fecha, c.hora),
          titulo: `Cocinar: ${nombreDe(c.plato)}`,
          detalle: `${c.para.length} ${c.para.length === 1 ? 'ración' : 'raciones'}. Los gramos están en MUTA.`,
        })
  if (a.comidas)
    for (const h of menu.huecos)
      if (fechas.includes(h.fecha))
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
