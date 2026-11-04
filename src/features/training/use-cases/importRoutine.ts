import { getDb, runTx } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { leerRutinaCsv, PREFIJO_MIA, type RutinaMia } from '../domain/csvRoutine.ts'
import type { ProgramData } from '../domain/program.ts'
import { cargarPlan } from './training.ts'

/** La plantilla que se descarga: los títulos y unas filas de ejemplo para ver el formato (se cambian por las tuyas). */
export const PLANTILLA_CSV = [
  'Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso;Notas',
  'Torso;Press banca;3;6-10;2;3:00;',
  'Torso;Remo con barra;3;8-12;2;2:30;',
  'Descanso;;;;;;',
  'Pierna;Sentadilla;3;6-10;2;3:00;',
  'Pierna;Curl femoral sentado;3;10-15;1;1:30;Ejemplo: borra estas filas y pon las tuyas',
].join('\n')

/** Empieza tu rutina del CSV: se guarda como un programa tuyo y pasa a ser tu plan (desde su primera sesión). */
export async function empezarRutinaCsv(
  nombre: string,
  programa: ProgramData,
  ahora = new Date(),
): Promise<boolean> {
  try {
    const id = `${PREFIJO_MIA}${ahora.getTime()}`
    const db = await getDb()
    await runTx(db, ['programs', 'plans', 'rotation'], async (tx) => {
      const mia: RutinaMia = { ...programa, id, title: nombre.trim() || 'Mi rutina' }
      await tx.objectStore('programs').put(mia)
      await tx.objectStore('plans').put({
        id: 'current',
        programId: id,
        source: id,
        variant: null,
        adaptation: null,
        weakPoints: null,
        priorities: null,
        chosenAt: ahora.toISOString(),
      })
      await tx.objectStore('rotation').delete('current')
    })
    await cargarPlan(true)
    return true
  } catch (error) {
    logError(error, 'empezar tu rutina del CSV')
    return false
  }
}

/** El CSV leído para enseñarlo: lo que no se pudo leer, tus días (sesiones con cuántos ejercicios, o descanso) y un resumen. */
export function vistaCsv(texto: string) {
  const r = leerRutinaCsv(texto)
  const dias = r.programa.blocks[0]?.weeks[0]?.days ?? []
  const descansos = dias.filter((d) => 'rest' in d).length
  return {
    programa: r.programa,
    errores: r.errores,
    dias: dias.map((d) =>
      'exercises' in d ? { nombre: d.name, ejercicios: d.exercises.length } : { descanso: true as const },
    ),
    resumen: [
      r.sesiones === 1 ? '1 sesión' : `${r.sesiones} sesiones`,
      r.ejercicios === 1 ? '1 ejercicio' : `${r.ejercicios} ejercicios`,
      ...(descansos ? [descansos === 1 ? '1 día de descanso' : `${descansos} días de descanso`] : []),
    ].join(' · '),
  }
}
