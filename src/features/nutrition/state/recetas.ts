// Lo que se ve de las recetas y de tus menús: los platos (recetario, de ejemplo y tuyos) con tus cambios, tus menús y tu
// semana, los gramos de cada comida ajustados a tu objetivo, lo de hoy y lo que propone tu nutricionista. Lo carga y
// guarda use-cases/recipes.ts y menu.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays } from '../../../shared/lib/format.ts'
import { ajustar, faltaDelDia, mejoresPara, REPARTOS, repartir, totalCon } from '../domain/fit.ts'
import { COMIDAS, type ComidaId, type Macros } from '../domain/food.ts'
import { extrasDe, totalDeExtras, totalDelDia } from '../domain/menuExtras.ts'
import {
  huecoDe as huecoDeMenu,
  menuDelDia,
  menuVacio,
  platosDe,
  semanaDesde,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import { loDeHoy } from '../domain/menuCocina.ts'
import { llevaLoQueNoQuieres } from '../domain/menuPlan.ts'
import { gramosEnCrudo, parejasEnCrudo } from '../domain/kitchen.ts'
import { opcionesPara, propuestasDelMenu } from '../domain/menuCoach.ts'
import { cambioEn, platoCon, type Plato, type Productos, type Recetario } from '../domain/recipes.ts'
import {
  alimentoPorId,
  apuntesDia,
  base,
  hoy,
  objetivoDelDia,
  objetivoDia,
  tipoDe,
  totalDia,
} from './comida.ts'

// Lo que las pantallas necesitan del dominio (no lo importan directamente)
export { tienePlatos } from '../domain/menuPlan.ts'
export {
  ajustar,
  cuadrarDia,
  desvio,
  llegaHasta,
  mejoresPara,
  parecidos,
  REPARTO,
  REPARTOS,
  repartir,
  totalCon,
} from '../domain/fit.ts'
export type { Ajuste, ComoComes, Encaje } from '../domain/fit.ts'
export {
  clave,
  diaDelCicloDe,
  seCocinaEl,
  menusDeLaSemana,
  conDiasPorMenu,
  diaSemana,
  diasDelMenu,
  huecoDe,
  huecosDelDia,
  MAX_MENUS,
  menuDelDia,
  LETRA_DIA,
  NOMBRE_DIA,
  DIA_LARGO,
  semanaDesde,
} from '../domain/menu.ts'
export type { Avisos, Cocinado, ExtraMenu, Hecho, Hueco, MenuPlan, MenuSemanal } from '../domain/menu.ts'

/** En un menú, si miras (y cambias) sus platos de un día de descanso (usuario, 2026-11-19). */
export const editandoDescanso = signal(false)
/** Los platos de un menú en el tipo de día que miras. */
export const platosDelMenu = (x: import('../domain/menu.ts').MenuPlan) => platosDe(x, editandoDescanso.value)
export type { PropuestaMenu } from '../domain/menuCoach.ts'
export { HORA_COMIDA } from '../domain/menuCalendar.ts'
export { DIAS_NEVERA, paraCocinar, pasanDeLaNevera } from '../domain/menuCocina.ts'
export type { Tarea } from '../domain/menuCocina.ts'
export { extrasDe, extrasDeDias, macrosDeExtra, totalDeExtras } from '../domain/menuExtras.ts'
export {
  cicloDe,
  diaDeHoy,
  diasDeComida,
  esComun,
  horaDeComida,
  llevaLoQueNoQuieres,
  MAX_DIAS_CICLO,
  MAX_PERSONAS,
  nombreDeComida,
} from '../domain/menuPlan.ts'
export { buscarPlatos, FILTRO_RECETAS, MACROS, vaCon } from '../domain/recipes.ts'
export type { FiltroRecetas } from '../domain/recipes.ts'
export type { CategoriaPlato, IngredientePlato, MacroId, Plato } from '../domain/recipes.ts'

/** El recetario (el tuyo de private/ o, si no hay, los platos de ejemplo del prototipo). */
export const recetario = signal<Recetario | null>(null)
export const estadoRecetas = signal<'sin-cargar' | 'cargando' | 'listo'>('sin-cargar')
export const platosTuyos = signal<Plato[]>([])
/** Las recetas que guardas (el marcador; rediseño 27–30). */
export const recetasGuardadas = signal<string[]>([])
export const menu = signal<MenuSemanal>(menuVacio())
export const productos = signal<Productos | null>(null)
/** La foto de cada plato del recetario (por id), o la tuya si le pusiste una. */
export const fotos = signal<Record<string, string>>({})
/** Los platos con tu foto (se puede quitar) y dónde centras cada foto (en %). */
export const conFotoTuya = signal<string[]>([])
export const encuadresPlatos = signal<Record<string, { x: number; y: number }>>({})

/** Para cuántas personas cocinas (la olla y la compra; lo tuyo no cambia). */
export const personas = computed(() => menu.value.personas ?? 1)

/** Cómo se reparte tu objetivo entre las comidas: según cómo sueles comer (sin elegir, repartido). */
export const repartoActual = computed(() => REPARTOS[menu.value.comoComes ?? 'repartido'])

/** Los platos tal como vienen (sin tus cambios). */
const platosOriginales = computed(() => [...(recetario.value?.platos ?? []), ...platosTuyos.value])

/**
 * Los platos con tus cambios (usuario, 2026-11-21: «que se cambie en todos los sitios»): las listas, las kcal de cada
 * fila, el menú y la compra leen la receta como la dejaste.
 */
export const platos = computed(() =>
  platosOriginales.value.map((p) => platoCon(p, productos.value, alimentoPorId, hoy.value)),
)

/** Los platos que MUTA te puede proponer: sin lo que no quieres comer (usuario, 2026-11-18). */
export const platosQueQuieres = computed(() =>
  menu.value.noQuiero?.length
    ? platos.value.filter((p) => !llevaLoQueNoQuieres(menu.value, p.ingredientes))
    : platos.value,
)

/** Un plato con tus cambios de ese día (tu marca, otro alimento). */
export function platoPorId(id: string, fecha = hoy.value): Plato | null {
  const p = platosOriginales.value.find((x) => x.id === id)
  return p ? platoCon(p, productos.value, alimentoPorId, fecha) : null
}

/** El plato tal como viene (sin tus cambios). */
export const platoOriginal = (id: string) => platosOriginales.value.find((x) => x.id === id) ?? null

/** El cambio de un ingrediente de un plato un día (null: como viene). */
export const cambioDe = (p: Plato, k: number, fecha = hoy.value) => cambioEn(productos.value, p, k, fecha)

/** Las categorías con sus platos, en el orden del recetario; los de ejemplo y los tuyos al final. */
export const categorias = computed(() => {
  // Con tus cambios (usuario, 2026-11-21: lo que cambias se ve también en las listas)
  const r = recetario.value
  const todos = platos.value
  // De la A a la Z (usuario, 2026-11-21); las de ejemplo y las tuyas, al final
  const az = (x: { nombre: string }, y: { nombre: string }) =>
    x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base' })
  const lista = (r?.categorias ?? [])
    .map((c) => ({
      ...c,
      // Las tuyas, también en la categoría que elegiste
      platos: todos.filter((p) => p.categoria === c.id).sort(az),
    }))
    .sort(az)
  const ejemplo = todos.filter((p) => p.origen === 'ejemplo').sort(az)
  if (ejemplo.length) lista.push({ id: 'ejemplo', nombre: 'De ejemplo', platos: ejemplo })
  const tuyos = todos.filter((p) => p.origen === 'tuyo').sort(az)
  if (tuyos.length) lista.push({ id: 'tuyos', nombre: 'Tuyos', platos: tuyos })
  return lista.filter((c) => c.platos.length)
})

/** Lo que lleva un plato con unos gramos (o los suyos) y unas raciones. */
export function totalDePlato(p: Plato, gramos?: readonly (number | null)[], veces = 1): Macros {
  return totalCon(p, gramos ?? p.ingredientes.map((i) => i.gramos), [], veces)
}

/** Lo que le toca a una comida de un día: su parte de tu objetivo (reparto sugerido). */
export function objetivoDeComida(fecha: string, comida: ComidaId): Macros | null {
  const o = objetivoDelDia(fecha)
  if (!o) return null
  const f = repartoActual.value[comida]
  return { kcal: o.kcal * f, protein: o.protein * f, carbs: o.carbs * f, fat: o.fat * f }
}

const cache = new Map<string, (number | null)[]>()

/** Los gramos de un plato en una comida de un día: ajustados a lo que le toca (si el plato se ajusta). */
export function gramosDeHueco(h: Hueco, p: Plato): (number | null)[] {
  const parte = objetivoDeComida(h.fecha, h.comida)
  // Lo que va además (una fruta, un yogur) sale de lo que le toca: el plato se ajusta a lo que queda
  const e = totalDeExtras(extrasDe(menu.value, h.fecha, h.comida))
  const o = parte && {
    kcal: Math.max(0, parte.kcal - e.kcal),
    protein: Math.max(0, parte.protein - e.protein),
    carbs: Math.max(0, parte.carbs - e.carbs),
    fat: Math.max(0, parte.fat - e.fat),
  }
  const fijo = menu.value.menus.find((x) => x.id === h.menu)?.fijos?.includes(h.comida)
  // Con los gramos de la receta (tu dieta): los de descanso, los días de descanso
  if (fijo && p.gramosDescanso && tipoDe(h.fecha) === 'descanso') return p.gramosDescanso
  if (!o || !p.ajustable || fijo) return p.ingredientes.map((i) => i.gramos)
  const k = `${p.id}|${p.total.kcal}|${p.ingredientes.map((i) => i.alimentoId).join(',')}|${o.kcal}|${o.protein}`
  let g = cache.get(k)
  if (!g) {
    g = ajustar(p, o).gramos
    cache.set(k, g)
  }
  return g
}

/** Lo que lleva una comida de un día con tu menú. */
export function totalDelHueco(h: Hueco): Macros | null {
  const p = platoPorId(h.plato, h.fecha)
  return p ? totalCon(p, gramosDeHueco(h, p)) : null
}

/** Lo que va además del plato en una comida de un día con tu menú. */
export const extrasDelDia = (fecha: string, comida: ComidaId) => extrasDe(menu.value, fecha, comida, tipoDe)

/** Lo que suma un día con tu menú. */
export const totalDeMenu = (fecha: string) => totalDelDia(menu.value, fecha, totalDelHueco)

/**
 * Lo que te falta en el día que ves (nunca menos de 0). Si te has pasado de grasa, lo que sobra se quita de los hidratos que
 * quedan: las recetas que se ajustan a lo que falta vienen con menos grasa y el día cuadra con tus kcal.
 */
export const faltaDia = computed<Macros | null>(() => {
  const o = objetivoDia.value
  return o ? faltaDelDia(o, totalDia.value) : null
})

/** Cuántos gramos de grasa te has pasado hoy (0 si no). */
export const grasaDeMas = computed(() => {
  const o = objetivoDia.value
  return o ? Math.max(0, Math.round(totalDia.value.fat - o.fat)) : 0
})

/** Las comidas del día que ves sin nada apuntado. */
export const comidasQueQuedan = computed<ComidaId[]>(() =>
  COMIDAS.map((c) => c.id).filter((c) => !apuntesDia.value.some((a) => a.comida === c)),
)

/** La siguiente comida sin apuntar y lo que le toca de lo que falta. */
export const siguiente = computed(() => {
  const falta = faltaDia.value
  const quedan = comidasQueQuedan.value
  if (!falta || !quedan.length || falta.kcal < 50) return null
  const comida = quedan[0]
  return { comida, objetivo: repartir(falta, quedan, repartoActual.value)[comida] }
})

/** Los platos que mejor encajan en la siguiente comida, ya ajustados. */
export const paraLaSiguiente = computed(() => {
  const s = siguiente.value
  if (!s) return []
  // Sin repetir el plato que ya llevas en tu menú en esa comida (usuario, 2026-11-17)
  const yaEnMenu = huecoDeMenu(menu.value, hoy.value, s.comida)?.plato
  return mejoresPara(platosQueQuieres.value, s.comida, s.objetivo, 6, yaEnMenu ? [yaEnMenu] : [])
})

/** Lo de hoy con hora (la compra y lo que cocinas). */
export const tareasDeHoy = computed(() => loDeHoy(menu.value, hoy.value))

/** Lo que propone tu nutricionista para tus menús (cada uno en su próximo día). */
export const propuestas = computed(() =>
  propuestasDelMenu(menu.value, semanaDesde(hoy.value), {
    platos: platos.value,
    objetivoDe: objetivoDelDia,
    objetivoDeComida,
    totalDe: totalDelHueco,
    usos: (id) => usosDePlatos.value.get(id) ?? 0,
  }),
)

/** Cuántas veces sale cada plato en tus menús (entreno, descanso y lo de más). */
const usosDePlatos = computed(() => {
  const n = new Map<string, number>()
  for (const x of menu.value.menus) {
    const ids = [
      ...Object.values(x.platos),
      ...Object.values(x.descanso ?? {}),
      ...Object.values(x.extras ?? {}).flatMap((es) => (es ?? []).map((e) => e.platoId)),
    ]
    for (const id of ids) if (id) n.set(id, (n.get(id) ?? 0) + 1)
  }
  return n
})

/** El menú de un día si ya tiene platos (null si no). */
export function menuConPlatos(fecha: string) {
  const m = menuDelDia(menu.value, fecha)
  return m && Object.keys(platosDe(m, tipoDe(fecha) === 'descanso')).length ? m : null
}

/** Mañana. */
export const manana = computed(() => addDays(hoy.value, 1))

/** La foto del plato de un apunte (si salió de un plato con foto). */
export function fotoDeApunte(receta: string | undefined): string | null {
  return receta ? (fotos.value[receta] ?? null) : null
}

/** Lo cocido de la base (cereales y legumbres genéricos) con su pareja en crudo. */
const parejas = computed(() => parejasEnCrudo((base.value ?? []).filter((a) => !a.codigo)))

/** Los cereales y legumbres cocidos con su pareja en crudo (el conversor de la cocina, rediseño 37). */
export const parejasCocidas = computed(() => [...parejas.value.values()])

/** «≈ 90 g en crudo» para unos gramos de arroz, pasta o legumbre cocidos; null si no es de eso o no se sabe. */
export function enCrudo(alimentoId: string | null, gramos: number | null): string | null {
  const par = alimentoId && gramos ? parejas.value.get(alimentoId) : null
  return par ? `≈ ${gramosEnCrudo(gramos!, par.cocido, par.crudo)} g en crudo` : null
}

/**
 * Lo que es en crudo un cereal o una legumbre cocidos: su nombre en crudo («Arroz blanco (crudo)») y sus gramos, para
 * pesarlo al cocinar. null si no es de eso o la base no tiene su pareja.
 */
export function enCrudoDe(
  alimentoId: string | null,
  gramosCocido: number,
): { nombre: string; gramos: number } | null {
  const par = alimentoId ? parejas.value.get(alimentoId) : null
  return par ? { nombre: par.crudo.name, gramos: gramosEnCrudo(gramosCocido, par.cocido, par.crudo) } : null
}

/** Lo contrario: unos gramos pesados en crudo, en gramos cocidos (por sus kcal), para sumar con los valores del plato. */
export function deCrudoACocido(alimentoId: string | null, gramosCrudo: number): number {
  const par = alimentoId ? parejas.value.get(alimentoId) : null
  return par ? (gramosCrudo * par.crudo.kcal) / par.cocido.kcal : gramosCrudo
}

/** Lo que propone tu nutricionista para una comida de un día: tus guardadas primero, con sus gramos para lo que falta. */
export function opcionesDeComida(fecha: string, comida: ComidaId, sin: readonly string[] = []) {
  const parte = objetivoDeComida(fecha, comida)
  if (!parte) return []
  return opcionesPara(
    mejoresPara(platosQueQuieres.value, comida, parte, 12, sin),
    new Set(recetasGuardadas.value),
    (id) => usosDePlatos.value.get(id) ?? 0,
  )
}
