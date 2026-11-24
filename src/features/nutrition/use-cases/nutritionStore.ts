// Cargar y guardar Comida en IndexedDB: tus ajustes, tu dieta y tu compra (`userContent`), lo apuntado (`foodLog`), tus
// pesajes y tus consultas (`bodyLog`) y los cambios de tu objetivo y de tu dieta (`coach`). Al cargar, la revisión semanal
// deja su sugerencia si toca (nunca la aplica); con dieta, manda la consulta semanal.
import { getDb } from '../../../shared/data/db.ts'
import { addDays, daysBetween, localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import type { Revision } from '../domain/consult.ts'
import type { DietaActiva } from '../domain/diet.ts'
import type { Alimento, Apunte } from '../domain/food.ts'
import {
  entrenoParaNutricion,
  fuerzaEnBasicos,
  rendimientoReciente,
  tiposDeDia,
} from '../../training/index.ts'
import { cuerpoParaComida } from '../../progress/index.ts'
import { ritmoSemanal } from '../domain/weight.ts'
import { tituloCambio } from '../domain/review.ts'
import {
  ajustes,
  cambios,
  diaVisto,
  dias,
  dieta,
  estado,
  guardadas,
  hoy,
  pasosDias,
  pesajes,
  propios,
  serie,
  tiposEntreno,
  type Ajustes,
  type Cambio,
  type ComidaGuardada,
} from '../state/comida.ts'
import {
  cuerpoProgreso,
  deEntreno,
  fuerzaBasicos,
  rendimientoComida,
  revisionDeHoy,
} from '../state/entrenador.ts'
import { compra, consultas, revisiones, type Compra, type Consulta } from '../state/dieta.ts'
import { nuevoId } from '../../../shared/lib/id.ts'
import { empezarLectura, estaLeido, leerLaRacha, olvidarLectura } from './diasLeidos.ts'

export const ID_AJUSTES = 'nutricion'
export const ID_PROPIOS = 'alimentos-propios'
export const ID_GUARDADAS = 'comidas-guardadas'
export const ID_DIETA = 'dieta'
export const ID_COMPRA = 'compra'
/** Tipo de lo que apuntas en la consulta en `bodyLog`. */
export const REVISION = 'checkin'
/** Tipo de los pesajes en `bodyLog`. */
export const PESO = 'weight'
/** Tipo de tus pasos de un día en `bodyLog` (se apuntan en Hoy). */
export const PASOS_TIPO = 'steps'
/** Cada cuántos días revisa el entrenador. */
const CADA = 7

export type DiaGuardado = { date: string; apuntes: Apunte[]; createdAt: string; updatedAt: string }
type PesajeGuardado = { date: string; type: typeof PESO; kg: number; createdAt: string; updatedAt: string }
type PasosGuardados = {
  date: string
  type: typeof PASOS_TIPO
  pasos: number
  createdAt: string
  updatedAt: string
}
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
      const [a, log, cuerpo, coach, mios, comidas, activa, lista, checkins, pasos] = await Promise.all([
        db.get('userContent', ID_AJUSTES) as Promise<Ajustes | undefined>,
        db.getAll('foodLog', IDBKeyRange.lowerBound(desde)) as Promise<DiaGuardado[]>,
        db.getAllFromIndex('bodyLog', 'type', PESO) as Promise<PesajeGuardado[]>,
        db.getAll('coach') as Promise<Cambio[]>,
        db.get('userContent', ID_PROPIOS) as Promise<{ alimentos: Alimento[] } | undefined>,
        db.get('userContent', ID_GUARDADAS) as Promise<{ comidas: ComidaGuardada[] } | undefined>,
        db.get('userContent', ID_DIETA) as Promise<DietaActiva | undefined>,
        db.get('userContent', ID_COMPRA) as Promise<Compra | undefined>,
        db.getAllFromIndex('bodyLog', 'type', REVISION) as Promise<RevisionGuardada[]>,
        db.getAllFromIndex('bodyLog', 'type', PASOS_TIPO) as Promise<PasosGuardados[]>,
      ])
      ajustes.value = a ?? null
      dias.value = Object.fromEntries(log.map((d) => [d.date, d.apuntes]))
      empezarLectura(desde)
      pesajes.value = cuerpo.map((p) => ({ date: p.date, kg: p.kg }))
      pasosDias.value = Object.fromEntries(pasos.map((p) => [p.date, p.pasos]))
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
      void cargarTipos().then(() => leerLaRacha())
      vigilarElDia()
      propios.value = mios?.alimentos ?? []
      guardadas.value = comidas?.comidas ?? []
      // Sin esperar: la pantalla se pinta ya. La revisión semanal va detrás, cuando se sepa tu fuerza (en volumen la mira)
      void Promise.all([cargarFuerza(), cargarCuerpo()])
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

let vigilando = false
/**
 * Con la app abierta de fondo al pasar la medianoche (usuario, 2026-11-23): al volver a ella, si ya es otro día, se vuelve a
 * cargar Nutrición con el día nuevo (lo que apuntes va a hoy, no a ayer).
 */
function vigilarElDia(): void {
  if (vigilando || typeof document === 'undefined') return
  vigilando = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || carga === null || localDate() === hoy.value) return
    carga = null
    olvidarLectura()
    void cargarComida()
  })
}

/** En volumen, tu fuerza en los básicos: la revisión la mira antes de proponer más kcal (guía G1 §6). */
export async function cargarFuerza(): Promise<void> {
  try {
    deEntreno.value = await entrenoParaNutricion(hoy.value)
  } catch (error) {
    logError(error, 'leer lo de Entreno')
  }
  if (ajustes.value?.fase !== 'volumen' && ajustes.value?.fase !== 'definicion') return
  try {
    fuerzaBasicos.value = (await fuerzaEnBasicos(hoy.value))?.cambio ?? null
    if (ajustes.value?.fase === 'definicion') rendimientoComida.value = await rendimientoReciente(hoy.value)
  } catch (error) {
    logError(error, 'leer tu fuerza en los básicos')
  }
}

/**
 * Lo de tu cuerpo que guarda Progreso (usuario, 2026-11-22): tus perímetros, cómo estás y tu grasa con tu objetivo, para
 * que la revisión decida como un entrenador.
 */
export async function cargarCuerpo(): Promise<void> {
  const a = ajustes.value
  if (!a) return
  try {
    cuerpoProgreso.value = await cuerpoParaComida({
      sexo: a.cuerpo.sexo,
      alturaCm: a.cuerpo.alturaCm,
      pesoKg: serie.value.at(-1)?.tendencia ?? a.cuerpo.pesoKg,
      ritmoPct: ritmoSemanal(serie.value, hoy.value)?.pctSemana ?? null,
    })
  } catch (error) {
    logError(error, 'leer tus medidas y cómo estás')
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

export async function guardarAjustes(nuevo: Ajustes): Promise<void> {
  const a = conLaDefinicion(ajustes.value, nuevo)
  ajustes.value = a
  await (await getDb()).put('userContent', a)
}

/**
 * Al cambiar de fase (usuario, 2026-11-22): al empezar una, tus kcal de entonces; al dejar una definición, cómo fue (de qué
 * kcal a cuáles, cuánto duró y si se atragantó), para la siguiente.
 */
function conLaDefinicion(previo: Ajustes | null, a: Ajustes): Ajustes {
  if (!previo || previo.fase === a.fase) return a
  // Al deshacer, lo que se guardó de antes manda
  const deshaciendo = a.kcalAlEmpezar !== previo.kcalAlEmpezar
  const conInicio = deshaciendo ? a : { ...a, kcalAlEmpezar: a.kcal }
  if (deshaciendo) return a
  if (previo.fase !== 'definicion') return conInicio
  return {
    ...conInicio,
    ultimaDefinicion: {
      desde: previo.faseDesde ?? previo.creado,
      hasta: hoy.value,
      kcalInicio: previo.kcalAlEmpezar ?? null,
      kcalFinal: previo.kcal,
    },
  }
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
export async function guardarDia(date: string, lista: Apunte[]): Promise<void> {
  // Un día que no se había leído: lo guardado se conserva y lo nuevo se suma (usuario, 2026-11-23: nada se borra sin
  // quitarlo tú). Si se había leído, la lista es la que ves y lo que falta es lo que quitaste; se pinta al momento.
  const leido = estaLeido(date)
  if (leido) dias.value = { ...dias.value, [date]: lista }
  const db = await getDb()
  const antes = (await db.get('foodLog', date)) as DiaGuardado | undefined
  const nuevos = new Set(lista.map((x) => x.id))
  const apuntes = !leido && antes ? [...antes.apuntes.filter((x) => !nuevos.has(x.id)), ...lista] : lista
  if (!leido) dias.value = { ...dias.value, [date]: apuntes }
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

/** Apunta tus pasos de un día (si ya había, los cambia). */
export async function apuntarPasos(pasos: number, date = hoy.value): Promise<void> {
  pasosDias.value = { ...pasosDias.value, [date]: pasos }
  const db = await getDb()
  const antes = (await db.get('bodyLog', [date, PASOS_TIPO])) as PasosGuardados | undefined
  const at = new Date().toISOString()
  const fila: PasosGuardados = {
    date,
    type: PASOS_TIPO,
    pasos,
    createdAt: antes?.createdAt ?? at,
    updatedAt: at,
  }
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
let tipos: Promise<void> | null = null

export function cargarTipos(): Promise<void> {
  tipos = (async () => {
    try {
      tiposEntreno.value = await tiposDeDia(hoy.value, addDays(hoy.value, -28), 49)
    } catch (error) {
      logError(error, 'leer tus días de entreno')
    }
  })()
  return tipos
}

/** Espera a tus días de entreno (tu semana resuelta cocina en tus descansos). */
export const tiposLeidos = () => tipos ?? Promise.resolve()

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
  olvidarLectura()
}
