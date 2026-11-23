// Cargar y guardar Progreso: pide a Comida tu peso, tu semana, tus consultas y tu cuerpo, a Entreno tus semanas, tu
// racha, tu fuerza, tus marcas, tus mesociclos, tus entrenos y tus récords (por sus index.ts), y lee y guarda lo suyo:
// tus medidas (`bodyLog`, tipo «perimetros»), tus fotos (`photos`) y tus ajustes de la composición (`userContent`).
import { getDb } from '../../../shared/data/db.ts'
import { localDate } from '../../../shared/lib/format.ts'
import { nuevoId } from '../../../shared/lib/id.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { platform, reducirImagen } from '../../../shared/platform/index.ts'
import { comidaParaProgreso } from '../../nutrition/index.ts'
import { encuadreDeEntreno, entrenoParaProgreso, fotoDeEntreno, fotoDeSerieDe } from '../../training/index.ts'
import type { Calibracion } from '../domain/composition.ts'
import { PERIMETROS } from '../domain/measures.ts'
import type { Foto, Pose } from '../domain/photos.ts'
import {
  ajustesCuerpo,
  comida,
  entreno,
  estado,
  fotos,
  hoy,
  medidas,
  sensaciones,
  type AjustesCuerpo,
  type FotoVista,
  type Medida,
  type Sensaciones,
} from '../state/progreso.ts'

/** Tipo de tus medidas en `bodyLog`. */
export const PERIMETROS_TIPO = 'perimetros'

type MedidaGuardada = Medida & { type: typeof PERIMETROS_TIPO; createdAt: string; updatedAt: string }

/** Tipo de ¿Cómo estás hoy? en `bodyLog`. */
export const SENSACIONES_TIPO = 'sensaciones'

type SensacionesGuardadas = Sensaciones & {
  type: typeof SENSACIONES_TIPO
  createdAt: string
  updatedAt: string
}

/** Una foto en `photos`: la imagen reducida, solo en tu móvil. */
type FotoGuardada = Foto & { imagen: Blob; createdAt: string }

/** En `userContent`: la calibración, tu objetivo de grasa y tu día de medidas. */
export const AJUSTES = 'composicion'
type AjustesGuardados = AjustesCuerpo & { id: typeof AJUSTES; target: 'composicion' }

/** El lado mayor de una foto guardada. */
const LADO = 1200

const soloMedidas = (m: MedidaGuardada): Medida => {
  const limpia: Medida = { date: m.date }
  for (const p of PERIMETROS) if (m[p.id]) limpia[p.id] = m[p.id]
  return limpia
}

function ponerFotos(lista: FotoGuardada[]) {
  for (const f of fotos.value) URL.revokeObjectURL(f.url)
  fotos.value = lista
    .map(({ id, date, pose, imagen }): FotoVista => ({ id, date, pose, url: URL.createObjectURL(imagen) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Carga Progreso cada vez que se abre (lo de Comida y Entreno puede haber cambiado). */
/** La foto de la sesión de un entreno (la tuya; null si no pusiste ninguna o no se pudo leer). */
export async function fotoDelEntreno(programId: string, sigla: string): Promise<Blob | null> {
  try {
    return await fotoDeEntreno(programId, sigla)
  } catch (error) {
    logError(error, 'leer la foto de un entreno')
    return null
  }
}

/** Dónde centraste la foto de la sesión de un entreno. */
export const encuadreDelEntreno = (programId: string, sigla: string) => encuadreDeEntreno(programId, sigla)

/** La foto de serie de un entreno (la que le tocó a su sesión). */
export async function fotoDeSerieDelEntreno(programId: string, sigla: string): Promise<string> {
  return fotoDeSerieDe(programId, sigla)
}

export async function cargarProgreso(): Promise<void> {
  hoy.value = localDate()
  const db = getDb()
  const [c, e, m, f, a, s] = await Promise.allSettled([
    comidaParaProgreso(),
    entrenoParaProgreso(hoy.value),
    db.then((d) => d.getAllFromIndex('bodyLog', 'type', PERIMETROS_TIPO) as Promise<MedidaGuardada[]>),
    db.then((d) => d.getAll('photos') as Promise<FotoGuardada[]>),
    db.then((d) => d.get('userContent', AJUSTES) as Promise<AjustesGuardados | undefined>),
    db.then((d) => d.getAllFromIndex('bodyLog', 'type', SENSACIONES_TIPO) as Promise<SensacionesGuardadas[]>),
  ])
  if (c.status === 'fulfilled') comida.value = c.value
  else logError(c.reason, 'leer lo de Comida para Progreso')
  if (e.status === 'fulfilled') entreno.value = e.value
  else logError(e.reason, 'leer lo de Entreno para Progreso')
  if (m.status === 'fulfilled') medidas.value = m.value.map(soloMedidas)
  else logError(m.reason, 'leer tus medidas')
  if (f.status === 'fulfilled') ponerFotos(f.value)
  else logError(f.reason, 'leer tus fotos')
  if (a.status === 'fulfilled' && a.value)
    ajustesCuerpo.value = {
      calibracion: a.value.calibracion ?? null,
      objetivo: a.value.objetivo ?? null,
      diaMedidas: a.value.diaMedidas ?? null,
    }
  else if (a.status === 'rejected') logError(a.reason, 'leer tus ajustes de la composición')
  if (s.status === 'fulfilled')
    sensaciones.value = s.value
      .map((x) => sinClaves(x, ['type', 'createdAt', 'updatedAt']))
      .sort((x, y) => x.date.localeCompare(y.date))
  else logError(s.reason, 'leer cómo estabas')
  estado.value = 'listo'
}

/** Guarda ¿Cómo estás hoy? (lo de hoy, entero: lo que no viene se quita). */
export async function apuntarSensaciones(s: Sensaciones): Promise<void> {
  sensaciones.value = [...sensaciones.value.filter((x) => x.date !== s.date), s].sort((x, y) =>
    x.date.localeCompare(y.date),
  )
  const db = await getDb()
  const antes = (await db.get('bodyLog', [s.date, SENSACIONES_TIPO])) as SensacionesGuardadas | undefined
  const at = new Date().toISOString()
  const fila: SensacionesGuardadas = {
    ...s,
    type: SENSACIONES_TIPO,
    createdAt: antes?.createdAt ?? at,
    updatedAt: at,
  }
  await db.put('bodyLog', fila)
}

/** Apunta tus medidas de hoy (si ya había, las cambia). Las que no se dan no se guardan. */
export async function apuntarMedidas(cm: Omit<Medida, 'date'>, date = hoy.value): Promise<void> {
  const limpia: Medida = { date }
  for (const [id, valor] of Object.entries(cm) as [keyof typeof cm, number | undefined][])
    if (valor) limpia[id] = valor
  medidas.value = [...medidas.value.filter((x) => x.date !== date), limpia]
  const db = await getDb()
  const antes = (await db.get('bodyLog', [date, PERIMETROS_TIPO])) as MedidaGuardada | undefined
  const at = new Date().toISOString()
  await db.put('bodyLog', {
    ...limpia,
    type: PERIMETROS_TIPO,
    createdAt: antes?.createdAt ?? at,
    updatedAt: at,
  })
}

/** Guarda tus fotos de hoy (una por postura; la de una postura que ya tenía foto hoy la sustituye). Devuelve si se pudo. */
export async function guardarFotos(nuevas: Partial<Record<Pose, Blob>>, date = hoy.value): Promise<boolean> {
  try {
    const db = await getDb()
    const todas = (await db.getAll('photos')) as FotoGuardada[]
    const at = new Date().toISOString()
    for (const [pose, archivo] of Object.entries(nuevas) as [Pose, Blob][]) {
      // Si el móvil no sabe reducirla (un formato raro), se guarda tal cual
      const imagen = await reducirImagen(archivo, LADO).catch(() => archivo)
      for (const vieja of todas.filter((x) => x.date === date && x.pose === pose))
        await db.delete('photos', vieja.id)
      await db.put('photos', { id: nuevoId(), date, pose, imagen, createdAt: at } satisfies FotoGuardada)
    }
    ponerFotos((await db.getAll('photos')) as FotoGuardada[])
    return true
  } catch (error) {
    logError(error, 'guardar tus fotos')
    return false
  }
}

/** Borra una foto de progreso. */
export async function borrarFoto(id: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete('photos', id)
    ponerFotos((await db.getAll('photos')) as FotoGuardada[])
  } catch (error) {
    logError(error, 'borrar una foto')
  }
}

async function guardarAjustes(a: AjustesCuerpo): Promise<void> {
  ajustesCuerpo.value = a
  const db = await getDb()
  await db.put('userContent', { ...a, id: AJUSTES, target: 'composicion' } satisfies AjustesGuardados)
}

/** Calibra con una medida real: guarda lo que dio menos lo que estima la fórmula hoy (`bruta`). */
export async function calibrar(medido: number, bruta: number): Promise<void> {
  const calibracion: Calibracion = {
    medido,
    diferencia: Math.round((medido - bruta) * 10) / 10,
    fecha: hoy.value,
  }
  await guardarAjustes({ ...ajustesCuerpo.value, calibracion })
}

export async function quitarCalibracion(): Promise<void> {
  await guardarAjustes({ ...ajustesCuerpo.value, calibracion: null })
}

/** Tu objetivo de grasa (en %). */
export async function elegirObjetivoGrasa(pct: number): Promise<void> {
  await guardarAjustes({ ...ajustesCuerpo.value, objetivo: pct })
}

/** El día del mes que eliges para tus medidas y fotos (null: a los 28 días de la última vez). */
export async function elegirDiaMedidas(dia: number | null): Promise<void> {
  await guardarAjustes({ ...ajustesCuerpo.value, diaMedidas: dia })
}

/**
 * La cámara de delante (o la de atrás) en un <video>, para las fotos del mes con su guía. Devuelve cómo apagarla, o null si
 * no hay cámara o no se da permiso (entonces se elige una foto de la galería).
 */
export function abrirCamara(video: HTMLVideoElement, facing: 'user' | 'environment') {
  return platform.startCamera(video, facing)
}
