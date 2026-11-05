// Cargar y guardar Comida en IndexedDB: tus ajustes (`userContent`), lo apuntado (`foodLog`), tus pesajes (`bodyLog`)
// y los cambios de tu objetivo (`coach`). Al cargar, la revisión semanal deja su sugerencia si toca (nunca la aplica).
import { getDb } from '../../../shared/data/db.ts'
import { addDays, daysBetween, localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import type { Alimento, Apunte } from '../domain/food.ts'
import { tituloCambio } from '../domain/review.ts'
import {
  ajustes,
  cambios,
  dias,
  estado,
  guardadas,
  hoy,
  pesajes,
  propios,
  revisionDeHoy,
  type Ajustes,
  type Cambio,
  type ComidaGuardada,
} from '../state/comida.ts'

export const ID_AJUSTES = 'nutricion'
export const ID_PROPIOS = 'alimentos-propios'
export const ID_GUARDADAS = 'comidas-guardadas'
/** Tipo de los pesajes en `bodyLog`. */
export const PESO = 'weight'
/** Cada cuántos días revisa el entrenador. */
const CADA = 7

type DiaGuardado = { date: string; apuntes: Apunte[]; createdAt: string; updatedAt: string }
type PesajeGuardado = { date: string; type: typeof PESO; kg: number; createdAt: string; updatedAt: string }

let carga: Promise<void> | null = null

/** Carga Comida (una vez por visita a la app; volver a la pestaña no recarga). */
export function cargarComida(): Promise<void> {
  carga ??= (async () => {
    try {
      const db = await getDb()
      hoy.value = localDate()
      const desde = addDays(hoy.value, -35)
      const [a, log, cuerpo, coach, mios, comidas] = await Promise.all([
        db.get('userContent', ID_AJUSTES) as Promise<Ajustes | undefined>,
        db.getAll('foodLog', IDBKeyRange.lowerBound(desde)) as Promise<DiaGuardado[]>,
        db.getAllFromIndex('bodyLog', 'type', PESO) as Promise<PesajeGuardado[]>,
        db.getAll('coach') as Promise<Cambio[]>,
        db.get('userContent', ID_PROPIOS) as Promise<{ alimentos: Alimento[] } | undefined>,
        db.get('userContent', ID_GUARDADAS) as Promise<{ comidas: ComidaGuardada[] } | undefined>,
      ])
      ajustes.value = a ?? null
      dias.value = Object.fromEntries(log.map((d) => [d.date, d.apuntes]))
      pesajes.value = cuerpo.map((p) => ({ date: p.date, kg: p.kg }))
      cambios.value = coach.filter((c) => c.area === 'nutricion')
      propios.value = mios?.alimentos ?? []
      guardadas.value = comidas?.comidas ?? []
      await revisarSemana()
    } catch (error) {
      logError(error, 'cargar Comida')
    } finally {
      estado.value = 'listo'
    }
  })()
  return carga
}

/**
 * La revisión semanal: cada 7 días deja una sugerencia (pendiente) o «sin cambios». Si faltan datos o hay que cumplir
 * primero, no guarda nada: «Tu objetivo» lo dice en vivo.
 */
async function revisarSemana(): Promise<void> {
  const a = ajustes.value
  const r = revisionDeHoy.value
  if (!a || !r || (r.tipo !== 'cambio' && r.tipo !== 'bien')) return
  const revisiones = cambios.value.filter((c) => c.tipo === 'sugerencia' || c.tipo === 'sin-cambios')
  const ultima = revisiones
    .map((c) => c.fecha)
    .sort()
    .at(-1)
  if (ultima && daysBetween(ultima, hoy.value) < CADA) return
  if (cambios.value.some((c) => c.status === 'pendiente')) return
  if (r.tipo === 'cambio') {
    await guardarCambio({
      status: 'pendiente',
      tipo: 'sugerencia',
      de: r.de,
      a: r.a,
      texto: tituloCambio(r, a.fase),
      revision: r,
    })
  } else {
    await guardarCambio({
      status: 'hecho',
      tipo: 'sin-cambios',
      de: null,
      a: a.kcal,
      texto: 'Vas al ritmo previsto',
    })
  }
}

export async function guardarAjustes(a: Ajustes): Promise<void> {
  ajustes.value = a
  await (await getDb()).put('userContent', a)
}

/** Guarda un cambio nuevo en el historial. */
export async function guardarCambio(
  c: Omit<Cambio, 'id' | 'area' | 'fecha' | 'createdAt' | 'updatedAt'>,
): Promise<Cambio> {
  const at = new Date().toISOString()
  const fila: Cambio = {
    ...c,
    id: crypto.randomUUID(),
    area: 'nutricion',
    fecha: hoy.value,
    createdAt: at,
    updatedAt: at,
  }
  cambios.value = [...cambios.value, fila]
  await (await getDb()).put('coach', fila)
  return fila
}

/** Cambia el estado de un cambio del historial. */
export async function marcarCambio(id: string, status: Cambio['status']): Promise<void> {
  const fila = cambios.value.find((c) => c.id === id)
  if (!fila) return
  const nueva = { ...fila, status, updatedAt: new Date().toISOString() }
  cambios.value = cambios.value.map((c) => (c.id === id ? nueva : c))
  await (await getDb()).put('coach', nueva)
}

/** Guarda lo apuntado en un día. */
export async function guardarDia(date: string, apuntes: Apunte[]): Promise<void> {
  dias.value = { ...dias.value, [date]: apuntes }
  const db = await getDb()
  const antes = (await db.get('foodLog', date)) as DiaGuardado | undefined
  const at = new Date().toISOString()
  await db.put('foodLog', { date, apuntes, createdAt: antes?.createdAt ?? at, updatedAt: at })
}

/** Apunta tu peso de un día (si ya había uno, lo cambia). */
export async function apuntarPeso(kg: number, date = hoy.value): Promise<void> {
  pesajes.value = [...pesajes.value.filter((p) => p.date !== date), { date, kg }]
  const db = await getDb()
  const antes = (await db.get('bodyLog', [date, PESO])) as PesajeGuardado | undefined
  const at = new Date().toISOString()
  const fila: PesajeGuardado = { date, type: PESO, kg, createdAt: antes?.createdAt ?? at, updatedAt: at }
  await db.put('bodyLog', fila)
}

export async function guardarPropios(alimentos: Alimento[]): Promise<void> {
  propios.value = alimentos
  await (await getDb()).put('userContent', { id: ID_PROPIOS, target: 'nutricion', alimentos })
}

export async function guardarGuardadas(comidas: ComidaGuardada[]): Promise<void> {
  guardadas.value = comidas
  await (await getDb()).put('userContent', { id: ID_GUARDADAS, target: 'nutricion', comidas })
}

/** Para las pruebas: vuelve a cargar desde la base de datos. */
export function olvidarCarga(): void {
  carga = null
}
