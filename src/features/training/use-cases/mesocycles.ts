// Tus mesociclos (almacén `mesocycles`): el que está en curso se crea solo con tu rutina y guarda, cada vez que se lee, tu
// plan y sus sesiones tal como están (así, al archivarlo, se queda con su rutina de verdad). Si cambias de rutina (desde
// el catálogo, un CSV o «Volver a usar»), el que estaba en curso se cierra el día antes de empezar el nuevo: nada se
// borra. También: renombrar, empezar otro con la misma rutina y elegir el básico de cada grupo de «Récords».
import { getDb } from '../../../shared/data/db.ts'
import { addDays } from '../../../shared/lib/format.ts'
import { nuevoId } from '../../../shared/lib/id.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { logError } from '../../../shared/lib/logger.ts'
import type { Mesociclo, SesionDelMeso } from '../domain/mesocycles.ts'
import { faseActual } from '../state/fase.ts'
import { entrenos, sesiones, tuPlan } from '../state/plan.ts'
import { cargarFase } from './fase.ts'
import { nombreDeVuelta } from '../domain/vueltas.ts'
import { quitarFinDeRutina } from './finDeRutina.ts'
import { cargarPlan } from './training.ts'

/** Como se guarda: `startDate` es el índice del almacén (el mismo día que `inicio`). */
type Fila = Mesociclo & { startDate: string }

const aFila = (m: Mesociclo): Fila => ({ ...m, startDate: m.inicio })
const deFila = (f: Fila): Mesociclo => sinClaves(f, ['startDate'])

/** Tus sesiones de ahora, en corto (lo que se queda de la rutina al archivarlo). */
const sesionesDeAhora = (): SesionDelMeso[] =>
  sesiones.value.map((s) => ({
    sigla: s.sigla,
    nombre: s.nombre,
    ejercicios: s.ejercicios.map((e) => ({ nombre: e.nombre, series: e.series, reps: e.reps, rir: e.rir })),
  }))

async function leerTodos(): Promise<Mesociclo[]> {
  const db = await getDb()
  return ((await db.getAll('mesocycles')) as Fila[])
    .map(deFila)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
}

async function guardar(...lista: Mesociclo[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('mesocycles', 'readwrite')
  await Promise.all([...lista.map((m) => tx.store.put(aFila(m))), tx.done])
}

async function borrar(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('mesocycles', id)
}

/** «Mesociclo 3»: el siguiente número. */
const nombreNuevo = (todos: readonly Mesociclo[]) => `Mesociclo ${todos.length + 1}`

/** Un mesociclo nuevo con tu rutina de ahora, desde `inicio`. */
async function nuevoConTuPlan(inicio: string, nombre: string): Promise<Mesociclo | null> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return null
  const db = await getDb()
  return {
    id: nuevoId(),
    nombre,
    inicio,
    fin: null,
    objetivo: faseActual.value,
    rutina: plan.rutina,
    programId: plan.programId,
    plan: (await db.get('plans', 'current')) ?? null,
    sesiones: sesionesDeAhora(),
    sesionesPorSemana: Math.max(1, sesiones.value.length),
  }
}

/**
 * Cierra el que está en curso para que empiece otro en `inicio`: termina el día antes. Si empezó ese mismo día, no
 * queda nada que archivar y se quita.
 */
async function cerrar(actual: Mesociclo, inicio: string): Promise<void> {
  if (actual.inicio >= inicio) await borrar(actual.id)
  else await guardar({ ...actual, fin: addDays(inicio, -1) })
}

/** La cola de `mesociclosAlDia`: uno detrás de otro, nunca dos a la vez. */
let enCola: Promise<unknown> = Promise.resolve()

/**
 * Tus mesociclos al día (con tu plan ya cargado): crea el primero, cierra el de otra rutina y guarda en el que está en
 * curso tu plan y tus sesiones de ahora. Devuelve el que está en curso (null sin rutina) y los archivados. Van en cola:
 * si dos pantallas lo piden a la vez (Progreso y el aviso de tu logro), la segunda ve lo que guardó la primera; si no,
 * cada una creaba su primera etapa y quedaban dos (2026-11-24).
 */
export function mesociclosAlDia(hoy: string): Promise<{ actual: Mesociclo | null; archivados: Mesociclo[] }> {
  const r = enCola.then(() => alDia(hoy))
  enCola = r.catch(() => undefined)
  return r
}

async function alDia(hoy: string): Promise<{ actual: Mesociclo | null; archivados: Mesociclo[] }> {
  await cargarPlan()
  await cargarFase()
  const todos = await leerTodos()
  const archivados = todos.filter((m) => m.fin)
  let actual = todos.find((m) => !m.fin) ?? null
  const plan = tuPlan.value
  if (plan.status !== 'ready') return { actual, archivados }
  if (actual && actual.programId !== plan.programId) {
    // Cambiaste de rutina: el nuevo empieza con tu primer entreno de la nueva (o hoy) y el de antes se cierra
    const primero = entrenos.value
      .filter((x) => x.programId === plan.programId && x.fecha > actual!.inicio)
      .reduce<string | null>((a, x) => (a && a < x.fecha ? a : x.fecha), null)
    const inicio = primero ?? hoy
    await cerrar(actual, inicio)
    const cerrado = (await leerTodos()).find((m) => m.id === actual!.id)
    if (cerrado) archivados.push(cerrado)
    actual = await nuevoConTuPlan(inicio, nombreNuevo(archivados))
  } else if (!actual) {
    // El primero: desde tu primer entreno con esta rutina (después del último archivado) o hoy
    const desde = archivados.at(-1)?.fin ?? ''
    const primero = entrenos.value
      .filter((x) => x.programId === plan.programId && x.fecha > desde)
      .reduce<string | null>((a, x) => (a && a < x.fecha ? a : x.fecha), null)
    actual = await nuevoConTuPlan(
      primero ?? hoy,
      archivados.length ? nombreNuevo(archivados) : 'Primer mesociclo',
    )
  } else {
    const db = await getDb()
    actual = {
      ...actual,
      rutina: plan.rutina,
      plan: (await db.get('plans', 'current')) ?? actual.plan,
      sesiones: sesionesDeAhora(),
      sesionesPorSemana: Math.max(1, sesiones.value.length),
      objetivo: actual.objetivo ?? faseActual.value,
    }
  }
  if (actual) await guardar(actual)
  return { actual, archivados }
}

/** Cambia el nombre de un mesociclo (vacío no vale). */
export async function renombrarMesociclo(id: string, nombre: string): Promise<boolean> {
  const limpio = nombre.trim().slice(0, 40)
  if (!limpio) return false
  try {
    const m = (await leerTodos()).find((x) => x.id === id)
    if (!m) return false
    await guardar({ ...m, nombre: limpio })
    return true
  } catch (error) {
    logError(error, 'renombrar el mesociclo')
    return false
  }
}

/** Empieza hoy otro mesociclo con tu rutina de ahora: el que estaba en curso se archiva con todo. */
export async function empezarMesociclo(nombre: string, hoy: string): Promise<boolean> {
  try {
    const { actual, archivados } = await mesociclosAlDia(hoy)
    if (!actual) return false
    await cerrar(actual, hoy)
    const quedan = actual.inicio < hoy ? archivados.length + 1 : archivados.length
    const nuevo = await nuevoConTuPlan(hoy, nombre.trim().slice(0, 40) || `Mesociclo ${quedan + 1}`)
    if (!nuevo) return false
    await guardar(nuevo)
    return true
  } catch (error) {
    logError(error, 'empezar un mesociclo')
    return false
  }
}

/**
 * «Repetirla» al terminar tu rutina (usuario, 2026-11-23): la etapa de ahora se archiva y empieza hoy otra con la misma
 * rutina («Definición» → «Definición · vuelta 2»), que se compara con ella a la misma semana. La rotación ya está en la
 * semana 1.
 */
export async function repetirRutina(hoy: string): Promise<boolean> {
  try {
    const { actual } = await mesociclosAlDia(hoy)
    if (!actual) return false
    // Una etapa que empezó hoy no tiene nada que archivar (se borraría): sigue ella, ya con la rutina en la semana 1
    if (actual.inicio >= hoy) {
      await quitarFinDeRutina()
      return true
    }
    const ok = await empezarMesociclo(nombreDeVuelta(actual.nombre), hoy)
    if (ok) await quitarFinDeRutina()
    return ok
  } catch (error) {
    logError(error, 'repetir la rutina')
    return false
  }
}

/**
 * Vuelve a usar la rutina de un mesociclo archivado, tal como la dejaste (tus cambios incluidos): el que está en curso se
 * archiva y empieza hoy otro con ella.
 */
export async function volverAUsarMesociclo(id: string, hoy: string): Promise<boolean> {
  try {
    const { actual, archivados } = await mesociclosAlDia(hoy)
    const viejo = archivados.find((m) => m.id === id)
    if (!viejo?.plan || typeof viejo.plan !== 'object') return false
    if (actual) await cerrar(actual, hoy)
    const db = await getDb()
    await db.put('plans', { ...(viejo.plan as object), id: 'current', chosenAt: new Date().toISOString() })
    await cargarPlan(true)
    const todos = await leerTodos()
    const nuevo = await nuevoConTuPlan(hoy, `${viejo.nombre} · otra vez`)
    if (!nuevo) return false
    await guardar({
      ...nuevo,
      nombre: todos.some((m) => m.nombre === nuevo.nombre) ? nombreNuevo(todos) : nuevo.nombre,
    })
    return true
  } catch (error) {
    logError(error, 'volver a usar la rutina de un mesociclo')
    return false
  }
}

/** En `userContent`: el básico que elegiste para cada grupo (se eligió en «Tus récords», ya quitado; sin elegir, el que más repites). */
const BASICOS = 'basicos'
type Basicos = { id: typeof BASICOS; target: 'basicos'; elegidos: Record<string, string> }

export async function leerBasicos(): Promise<Record<string, string>> {
  const db = await getDb()
  return ((await db.get('userContent', BASICOS)) as Basicos | undefined)?.elegidos ?? {}
}
