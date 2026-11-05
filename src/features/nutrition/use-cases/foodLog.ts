// Lo que apuntas: añadir, cambiar y quitar (con «Deshacer»), repetir lo de ayer, comidas guardadas y tus alimentos.
import { formatDecimal, formatInt } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import {
  buscarAlimentos,
  gramosDe,
  macrosDe,
  POPULARES,
  recientes,
  sumar,
  type Alimento,
  type Apunte,
  type ComidaId,
  type Macros,
  type Modo,
} from '../domain/food.ts'
import { alimentoPorId, base, deAyer, dias, guardadas, hoy, propios } from '../state/comida.ts'
import { guardarDia, guardarGuardadas, guardarPropios } from './nutritionStore.ts'

/** Categoría de lo que creas tú. */
export const MIS_ALIMENTOS = 'Mis alimentos'

let descarga: Promise<Alimento[]> | null = null

/** La base de 1.493 alimentos: se descarga aparte la primera vez que hace falta (no pesa al abrir la app). */
export function cargarAlimentos(): Promise<Alimento[]> {
  descarga ??= import('../../../shared/content/foods.json')
    .then((m) => {
      base.value = m.default as Alimento[]
      return base.value
    })
    .catch((error) => {
      descarga = null
      logError(error, 'cargar la base de alimentos')
      return []
    })
  return descarga
}

/** Un apunte de un alimento con su cantidad. */
export function apunteDe(
  alimento: Alimento,
  cantidad: number,
  modo: Modo,
  comida: ComidaId,
): Omit<Apunte, 'id'> {
  const gramos = Math.round(gramosDe(alimento, cantidad, modo))
  return {
    comida,
    nombre: alimento.name,
    alimentoId: alimento.id,
    gramos,
    raciones: modo === 'racion' ? cantidad : null,
    racion: modo === 'racion' ? alimento.servingLabel : null,
    ...macrosDe(alimento, gramos),
  }
}

/** Añade a hoy. Devuelve el id (para «Deshacer»). */
export async function anadir(apunte: Omit<Apunte, 'id'>, date = hoy.value): Promise<string> {
  const id = crypto.randomUUID()
  await guardarDia(date, [...(dias.value[date] ?? []), { ...apunte, id }])
  return id
}

/** Añade varios a la vez (repetir, comida guardada). Devuelve sus ids. */
export async function anadirVarios(
  apuntes: readonly Apunte[],
  comida: ComidaId,
  date = hoy.value,
): Promise<string[]> {
  const nuevos = apuntes.map((a) => ({ ...a, comida, id: crypto.randomUUID() }))
  await guardarDia(date, [...(dias.value[date] ?? []), ...nuevos])
  return nuevos.map((a) => a.id)
}

/** Cambia un apunte (cantidad, comida). */
export async function cambiar(apunte: Apunte, date = hoy.value): Promise<void> {
  await guardarDia(
    date,
    (dias.value[date] ?? []).map((a) => (a.id === apunte.id ? apunte : a)),
  )
}

/** Quita unos apuntes. Devuelve lo quitado, para poder volver a ponerlo. */
export async function quitar(ids: readonly string[], date = hoy.value): Promise<Apunte[]> {
  const antes = dias.value[date] ?? []
  await guardarDia(
    date,
    antes.filter((a) => !ids.includes(a.id)),
  )
  return antes.filter((a) => ids.includes(a.id))
}

/** Vuelve a poner lo quitado («Deshacer»). */
export async function devolver(apuntes: readonly Apunte[], date = hoy.value): Promise<void> {
  const ids = new Set((dias.value[date] ?? []).map((a) => a.id))
  await guardarDia(date, [...(dias.value[date] ?? []), ...apuntes.filter((a) => !ids.has(a.id))])
}

/** Repite lo de ayer en una comida. Devuelve los ids añadidos. */
export function repetirDeAyer(comida: ComidaId): Promise<string[]> {
  return anadirVarios(deAyer(comida), comida)
}

/** Lo de ayer en una comida, en una línea: «Tortilla y ensalada · 612 kcal». */
export function resumenDeAyer(comida: ComidaId): { nombres: string; kcal: number } | null {
  const ayer = deAyer(comida)
  if (!ayer.length) return null
  return { nombres: ayer.map((a) => a.nombre).join(', '), kcal: sumar(ayer).kcal }
}

/** Solo kcal y proteína (para comer fuera); hidratos y grasa, si los sabes. */
export function apunteRapido(nombre: string, m: Macros, comida: ComidaId): Omit<Apunte, 'id'> {
  return {
    comida,
    nombre: nombre.trim() || 'Añadido rápido',
    alimentoId: null,
    gramos: null,
    raciones: null,
    racion: null,
    ...m,
  }
}

/** Guarda una comida de hoy para repetirla otro día (★). */
export async function guardarComida(nombre: string, comida: ComidaId): Promise<void> {
  const apuntes = (dias.value[hoy.value] ?? []).filter((a) => a.comida === comida)
  if (!apuntes.length) return
  await guardarGuardadas([
    { id: crypto.randomUUID(), nombre: nombre.trim() || 'Mi comida', apuntes },
    ...guardadas.value,
  ])
}

export async function borrarGuardada(id: string): Promise<void> {
  await guardarGuardadas(guardadas.value.filter((g) => g.id !== id))
}

/** Crea un alimento tuyo con los valores por 100 g de la etiqueta. */
export async function crearAlimento(datos: Omit<Alimento, 'id' | 'category'>): Promise<Alimento> {
  const nuevo: Alimento = { ...datos, id: `u_${crypto.randomUUID()}`, category: MIS_ALIMENTOS }
  await guardarPropios([nuevo, ...propios.value])
  return nuevo
}

/** Lo que sale al abrir «Añadir» sin buscar: tus recientes o, si aún no hay, los más habituales. */
export function sugeridos(): { alimentos: Alimento[]; habituales: boolean } {
  const tuyos = recientes(Object.entries(dias.value).map(([date, apuntes]) => ({ date, apuntes })))
    .map(alimentoPorId)
    .filter((a): a is Alimento => a !== null)
  if (tuyos.length) return { alimentos: tuyos, habituales: false }
  return {
    alimentos: POPULARES.map(alimentoPorId).filter((a): a is Alimento => a !== null),
    habituales: true,
  }
}

/** Las categorías de la base, en su orden. */
export function categorias(): string[] {
  return [...new Set((base.value ?? []).map((a) => a.category))]
}

/** Busca en tus alimentos y en la base (sin tildes; lo cocinado antes que lo crudo). */
export function buscar(texto: string): Alimento[] {
  return buscarAlimentos([...propios.value, ...(base.value ?? [])], texto)
}

/** Macros de una ración habitual del alimento. */
export function porRacion(a: Alimento): Macros {
  return macrosDe(a, a.servingG)
}

/** Una ración habitual, como apunte (el «+» de la lista): en gramos si se pesa, si no, una ración. */
export function unaRacion(a: Alimento, comida: ComidaId, modo: Modo): Omit<Apunte, 'id'> {
  return apunteDe(a, modo === 'gramos' ? a.servingG : 1, modo, comida)
}

/** La cantidad apuntada, en palabras: «1,5 filete · 225 g», «80 g». */
export function textoCantidad(a: Pick<Apunte, 'raciones' | 'racion' | 'gramos'>): string {
  if (a.raciones !== null && a.racion)
    return `${formatDecimal(a.raciones)} ${a.racion} · ${formatInt(a.gramos ?? 0)} g`
  return a.gramos !== null ? `${formatInt(a.gramos)} g` : ''
}

/** La ración habitual en palabras: «1 filete (150 g)». */
export function textoRacion(a: Alimento): string {
  return `1 ${a.servingLabel} (${formatInt(a.servingG)} g)`
}
