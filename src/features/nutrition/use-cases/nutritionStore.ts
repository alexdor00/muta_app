// Cargar y guardar Comida en IndexedDB: tus ajustes, tu dieta y tu compra (`userContent`), lo apuntado (`foodLog`), tus
// pesajes y tus consultas (`bodyLog`) y los cambios de tu objetivo y de tu dieta (`coach`). Al cargar, la revisión semanal
// deja su sugerencia si toca (nunca la aplica); con dieta, manda la consulta semanal.
import { getDb } from '../../../shared/data/db.ts'
import { addDays, daysBetween, localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import type { Revision } from '../domain/consult.ts'
import type { DietaActiva } from '../domain/diet.ts'
import type { Alimento, Apunte } from '../domain/food.ts'
import { fuerzaEnBasicos, tiposDeDia } from '../../training/index.ts'
import { tituloCambio } from '../domain/review.ts'
import {
  ajustes,
  cambios,
  diaVisto,
  dias,
  dieta,
  estado,
  fuerzaBasicos,
  guardadas,
  hoy,
  pesajes,
  propios,
  revisionDeHoy,
  tiposEntreno,
  type Ajustes,
  type Cambio,
  type ComidaGuardada,
} from '../state/comida.ts'
import { compra, consultas, revisiones, type Compra, type Consulta } from '../state/dieta.ts'
import { nuevoId } from '../../../shared/lib/id.ts'

export const ID_AJUSTES = 'nutricion'
export const ID_PROPIOS = 'alimentos-propios'
export const ID_GUARDADAS = 'comidas-guardadas'
export const ID_DIETA = 'dieta'
export const ID_COMPRA = 'compra'
/** Tipo de lo que apuntas en la consulta en `bodyLog`. */
export const REVISION = 'checkin'
/** Tipo de los pesajes en `bodyLog`. */
export const PESO = 'weight'
/** Cada cuántos días revisa el entrenador. */
const CADA = 7

type DiaGuardado = { date: string; apuntes: Apunte[]; createdAt: string; updatedAt: string }
type PesajeGuardado = { date: string; type: typeof PESO; kg: number; createdAt: string; updatedAt: string }
type RevisionGuardada = Revision & {
  date: string
  type: typeof REVISION
  createdAt: string
  updatedAt: string
}

let carga: Promise<void> | null = null

/** Carga Comida (una vez por visita a la app; volver a la pestaña no recarga). */
export function cargarComida(): Promise<void> {
  carga ??= (async () => {
    try {
      const db = await getDb()
      hoy.value = localDate()
      diaVisto.value = hoy.value
      const desde = addDays(hoy.value, -35)
      const [a, log, cuerpo, coach, mios, comidas, activa, lista, checkins] = await Promise.all([
        db.get('userContent', ID_AJUSTES) as Promise<Ajustes | undefined>,
        db.getAll('foodLog', IDBKeyRange.lowerBound(desde)) as Promise<DiaGuardado[]>,
        db.getAllFromIndex('bodyLog', 'type', PESO) as Promise<PesajeGuardado[]>,
        db.getAll('coach') as Promise<Cambio[]>,
        db.get('userContent', ID_PROPIOS) as Promise<{ alimentos: Alimento[] } | undefined>,
        db.get('userContent', ID_GUARDADAS) as Promise<{ comidas: ComidaGuardada[] } | undefined>,
        db.get('userContent', ID_DIETA) as Promise<DietaActiva | undefined>,
        db.get('userContent', ID_COMPRA) as Promise<Compra | undefined>,
        db.getAllFromIndex('bodyLog', 'type', REVISION) as Promise<RevisionGuardada[]>,
      ])
      ajustes.value = a ?? null
      dias.value = Object.fromEntries(log.map((d) => [d.date, d.apuntes]))
      pesajes.value = cuerpo.map((p) => ({ date: p.date, kg: p.kg }))
      cambios.value = coach.filter((c) => c.area === 'nutricion')
      consultas.value = (coach as unknown[] as Consulta[]).filter((c) => c.area === 'dieta')
      dieta.value = activa ? { ...activa, originales: activa.originales ?? {} } : null
      compra.value = lista ?? null
      revisiones.value = checkins
        .map(({ fecha, cintura, sueno, hambre, energia, fatiga, dolor, ganas, estres, nota }) => ({
          fecha,
          cintura,
          sueno,
          hambre,
          energia,
          fatiga,
          dolor,
          ganas,
          estres,
          nota,
        }))
        .sort((x, y) => x.fecha.localeCompare(y.fecha))
      void cargarTipos()
      propios.value = mios?.alimentos ?? []
      guardadas.value = comidas?.comidas ?? []
      // Sin esperar: la pantalla se pinta ya. La revisión semanal va detrás, cuando se sepa tu fuerza (en volumen la mira)
      void cargarFuerza()
        .then(() => revisarSemana())
        .catch((error: unknown) => logError(error, 'revisar la semana'))
    } catch (error) {
      logError(error, 'cargar Comida')
    } finally {
      estado.value = 'listo'
    }
  })()
  return carga
}

/** En volumen, tu fuerza en los básicos: la revisión la mira antes de proponer más kcal (guía G1 §6). */
async function cargarFuerza(): Promise<void> {
  if (ajustes.value?.fase !== 'volumen' && ajustes.value?.fase !== 'definicion') return
  try {
    fuerzaBasicos.value = (await fuerzaEnBasicos(hoy.value))?.cambio ?? null
  } catch (error) {
    logError(error, 'leer tu fuerza en los básicos')
  }
}

/**
 * La revisión semanal: cada 7 días deja una sugerencia (pendiente) o «sin cambios». Si faltan datos o hay que cumplir
 * primero, no guarda nada: «Tu objetivo» lo dice en vivo.
 */
async function revisarSemana(): Promise<void> {
  const a = ajustes.value
  const r = revisionDeHoy.value
  if (dieta.value) return
  if (!a || !r || (r.tipo !== 'cambio' && r.tipo !== 'bien')) return
  const previas = cambios.value.filter((c) => c.tipo === 'sugerencia' || c.tipo === 'sin-cambios')
  const ultima = previas
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
    id: nuevoId(),
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

/** Qué días son de entreno según tu rutina (4 semanas atrás y 3 adelante: la consulta, el menú y la compra). */
export async function cargarTipos(): Promise<void> {
  try {
    tiposEntreno.value = await tiposDeDia(hoy.value, addDays(hoy.value, -28), 49)
  } catch (error) {
    logError(error, 'leer tus días de entreno')
  }
}

export async function guardarDieta(activa: DietaActiva | null): Promise<void> {
  dieta.value = activa
  const db = await getDb()
  if (activa) await db.put('userContent', activa)
  else await db.delete('userContent', ID_DIETA)
}

export async function guardarCompra(lista: Compra): Promise<void> {
  compra.value = lista
  await (await getDb()).put('userContent', lista)
}

/** Guarda lo que apuntas en la consulta de un día (si ya había, lo cambia). */
export async function guardarRevision(r: Revision): Promise<void> {
  revisiones.value = [...revisiones.value.filter((x) => x.fecha !== r.fecha), r].sort((x, y) =>
    x.fecha.localeCompare(y.fecha),
  )
  const db = await getDb()
  const antes = (await db.get('bodyLog', [r.fecha, REVISION])) as RevisionGuardada | undefined
  const at = new Date().toISOString()
  const fila: RevisionGuardada = {
    ...r,
    date: r.fecha,
    type: REVISION,
    createdAt: antes?.createdAt ?? at,
    updatedAt: at,
  }
  await db.put('bodyLog', fila)
}

/** Guarda una consulta (nueva o cambiada). */
export async function guardarConsulta(c: Consulta): Promise<void> {
  consultas.value = [...consultas.value.filter((x) => x.id !== c.id), c]
  await (await getDb()).put('coach', c)
}

/** Para las pruebas: vuelve a cargar desde la base de datos. */
export function olvidarCarga(): void {
  carga = null
}
