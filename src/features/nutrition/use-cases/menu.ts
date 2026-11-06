// Tu menú: poner y quitar platos, cuándo cocinas, el día de la compra, tus avisos (al calendario del móvil: la app no
// tiene servidor), cuadrar la semana y lo que propone tu nutricionista («Aplicar», «Ahora no» y «Deshacer»).
import { getDb } from '../../../shared/data/db.ts'
import { platform } from '../../../shared/platform/index.ts'
import { ajustar, REPARTO } from '../domain/fit.ts'
import type { ComidaId } from '../domain/food.ts'
import {
  calendarioDelMenu,
  clave,
  conCocinado,
  conHueco,
  huecoDe,
  huecosDelDia,
  semanaDesde,
  sinCocinado,
  sinHueco,
  type Avisos,
  type Cocinado,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import type { PropuestaMenu } from '../domain/menuCoach.ts'
import { hoy, objetivoDelDia } from '../state/comida.ts'
import { menu, platoPorId, valoresDe } from '../state/recetas.ts'
import { ID_MENU } from './recipes.ts'

async function guardar(m: MenuSemanal): Promise<void> {
  menu.value = m
  await (await getDb()).put('userContent', { ...m, id: ID_MENU })
}

/** Lo que le toca a una comida de un día: su parte del objetivo (reparto sugerido). */
export function objetivoDeComida(fecha: string, comida: ComidaId) {
  const o = objetivoDelDia(fecha)
  if (!o) return null
  const f = REPARTO[comida]
  return { kcal: o.kcal * f, protein: o.protein * f, carbs: o.carbs * f, fat: o.fat * f }
}

/** Pone un plato en una comida, ya ajustado a lo que le toca ese día (si se puede). */
export function ponerPlato(fecha: string, comida: ComidaId, platoId: string, ajustado = true): Promise<void> {
  const p = platoPorId(platoId)
  const o = objetivoDeComida(fecha, comida)
  const gramos = p && o && ajustado && p.ajustable ? ajustar(p, o, valoresDe(p)).gramos : null
  return guardar(conHueco(menu.value, { fecha, comida, plato: platoId, gramos, cocinado: null }))
}

/** Pone un hueco tal cual (con sus gramos). */
export const ponerHueco = (h: Hueco) => guardar(conHueco(menu.value, h))

/** Quita el plato de una comida. Devuelve lo quitado (para «Deshacer»). */
export async function quitarPlato(fecha: string, comida: ComidaId): Promise<Hueco | null> {
  const h = huecoDe(menu.value, fecha, comida)
  await guardar(sinHueco(menu.value, fecha, comida))
  return h
}

/** Vuelve a ajustar los gramos de todos los platos de la semana a lo que le toca a cada comida. */
export async function cuadrarSemana(fechas: readonly string[]): Promise<number> {
  let m = menu.value
  let n = 0
  for (const h of m.huecos) {
    if (!fechas.includes(h.fecha)) continue
    const p = platoPorId(h.plato)
    const o = objetivoDeComida(h.fecha, h.comida)
    if (!p || !o || !p.ajustable) continue
    m = conHueco(m, { ...h, gramos: ajustar(p, o, valoresDe(p)).gramos })
    n++
  }
  await guardar(m)
  return n
}

/** Guarda cuándo cocinas un plato y para qué comidas (si no queda ninguna, se quita). */
export function guardarCocinado(c: Cocinado): Promise<void> {
  return guardar(c.para.length ? conCocinado(menu.value, c) : sinCocinado(menu.value, c.id))
}

export const quitarCocinado = (id: string) => guardar(sinCocinado(menu.value, id))

/** Un cocinado nuevo para una comida: ese día, a una hora sugerida, solo para ella. */
export function cocinadoNuevo(fecha: string, comida: ComidaId, platoId: string): Cocinado {
  return { id: crypto.randomUUID(), plato: platoId, fecha, hora: '18:00', para: [clave(fecha, comida)] }
}

/** Las comidas en las que podría ir un cocinado: las del mismo plato desde ese día, 7 días. */
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

/** Aplica una propuesta: cambia esas comidas y lo deja en «Ya hecho» para deshacerlo. */
export function aplicarPropuesta(p: PropuestaMenu): Promise<void> {
  let m = menu.value
  for (const h of p.despues) m = conHueco(m, h)
  const hecho = {
    id: crypto.randomUUID(),
    fecha: hoy.value,
    titulo: p.titulo,
    detalle: p.detalle,
    antes: p.antes,
    despues: p.despues,
    estado: 'aplicado' as const,
  }
  return guardar({ ...m, hechos: [hecho, ...m.hechos].slice(0, 20) })
}

export const ahoraNo = (p: PropuestaMenu) =>
  guardar({ ...menu.value, descartadas: [...menu.value.descartadas, p.id].slice(-100) })

/** Deshace lo aplicado: vuelven los platos y gramos de antes. */
export function deshacerHecho(id: string): Promise<void> {
  const hecho = menu.value.hechos.find((x) => x.id === id)
  if (!hecho || hecho.estado !== 'aplicado') return Promise.resolve()
  let m = menu.value
  for (const h of hecho.despues) m = sinHueco(m, h.fecha, h.comida)
  for (const h of hecho.antes) m = conHueco(m, h)
  return guardar({
    ...m,
    hechos: m.hechos.map((x) => (x.id === id ? { ...x, estado: 'deshecho' as const } : x)),
  })
}

/** Vuelve a dejar las comidas como estaban (deshacer «Cuadrar la semana»). */
export const volverAHuecos = (huecos: Hueco[]) => guardar({ ...menu.value, huecos })
