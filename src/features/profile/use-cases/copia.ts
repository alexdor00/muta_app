// Guardar y recuperar tu copia de seguridad (usuario, 2026-11-24): un archivo con todo (también tus fotos) que guardas
// donde quieras con el menú de compartir; recuperarla sustituye lo de este móvil, guardando antes aparte lo de ahora.
import {
  BackupError,
  copiaEnTexto,
  exportBackup,
  importBackup,
  leerCopia,
  marcarCopia,
  needsBackupReminder,
  resumenCopia,
  type Backup,
} from '../../../shared/data/backup/backup.ts'
import { getDb, guardarAparte, readAll } from '../../../shared/data/db.ts'
import { SCHEMA_VERSION } from '../../../shared/data/migrations/index.ts'
import { DB_NAME } from '../../../shared/data/schema.ts'
import { localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { platform } from '../../../shared/platform/index.ts'
import { copia } from '../state/copia.ts'

const POSPUESTA = 'backupPospuestaAt'
type Meta = { key: string; value: string } | undefined

export async function cargarCopia(): Promise<void> {
  try {
    const db = await getDb()
    const [ultima, pospuesta, perfil] = await Promise.all([
      db.get('meta', 'lastBackupAt') as Promise<Meta>,
      db.get('meta', POSPUESTA) as Promise<Meta>,
      db.get('profile', 'me') as Promise<{ createdAt?: string } | undefined>,
    ])
    copia.value = {
      ultima: ultima?.value ?? null,
      toca:
        !!perfil &&
        needsBackupReminder(
          ultima?.value ?? null,
          new Date(),
          perfil?.createdAt ?? null,
          pospuesta?.value ?? null,
        ),
    }
  } catch (error) {
    logError(error, 'leer tu copia')
  }
}

/**
 * Guarda la copia: un archivo `muta-copia-AAAA-MM-DD.json` por el menú de compartir (o se descarga si el móvil no deja).
 * Solo si se guardó de verdad se apunta la fecha.
 */
export async function guardarCopia(): Promise<'guardada' | 'cancelada' | 'error'> {
  try {
    const db = await getDb()
    const ahora = new Date()
    const texto = await copiaEnTexto(await exportBackup(db, ahora))
    const archivo = new File([texto], `muta-copia-${localDate(ahora)}.json`, { type: 'application/json' })
    const r = await platform.shareFile('Copia de MUTA', archivo)
    if (r === 'none') return 'cancelada'
    await marcarCopia(db, ahora)
    await cargarCopia()
    return 'guardada'
  } catch (error) {
    logError(error, 'guardar tu copia')
    return 'error'
  }
}

/** «Ahora no» en el recordatorio: vuelve dentro de un mes. */
export async function posponerCopia(): Promise<void> {
  try {
    await (await getDb()).put('meta', { key: POSPUESTA, value: new Date().toISOString() })
    await cargarCopia()
  } catch (error) {
    logError(error, 'posponer tu copia')
  }
}

export type CopiaLeida = { copia: Backup; resumen: ReturnType<typeof resumenCopia> }

/** Lee el archivo elegido: la copia y lo que trae, o qué falla. */
export async function abrirCopia(archivo: File): Promise<CopiaLeida | { error: string }> {
  try {
    const c = leerCopia(await archivo.text())
    return { copia: c, resumen: resumenCopia(c) }
  } catch (error) {
    if (error instanceof BackupError) return { error: error.message }
    logError(error, 'abrir una copia')
    return { error: 'No se pudo leer el archivo.' }
  }
}

/**
 * Recupera una copia: antes guarda aparte todo lo de ahora (en `muta-backups`, por si te equivocas) y después lo sustituye
 * por la copia, en una sola transacción (si algo falla, queda como estaba). Luego hay que recargar la app.
 */
export async function recuperarCopia(c: Backup): Promise<boolean> {
  try {
    const db = await getDb()
    await guardarAparte(DB_NAME, SCHEMA_VERSION, await readAll(db))
    await importBackup(db, c)
    return true
  } catch (error) {
    logError(error, 'recuperar una copia')
    return false
  }
}
