import { useEffect } from 'preact/hooks'
import { addDays, localDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ORDEN_TAREA, type TareaDeHoy } from '../../../../shared/lib/tareaDeHoy.ts'
import {
  claveEjercicio,
  descansasHoy,
  descansosPorSemana,
  entrenos,
  recordsDelDia,
  tocaHoy,
  tuPlan,
} from '../../state/plan.ts'
import { diasDeRacha } from '../../state/routines.ts'
import { cargarPlan } from '../../use-cases/training.ts'

export type HoyDeEntreno = {
  /** Aún cargando: Hoy no se pinta hasta tenerlo. */
  listo: boolean
  tareas: TareaDeHoy[]
  /** Hoy toca un descanso de tu rutina (y no has entrenado). */
  descansas: boolean
  racha: number | null
  /** Lo de mañana en una línea: «Descansas» o «A2 · Espalda y cuádriceps» (null sin rutina). */
  manana: string | null
  /** Los ejercicios con récord hoy (tu mejor marca de siempre); vacío si ninguno. */
  records: string[]
}

/**
 * Lo de Entreno en Hoy: la sesión que toca, como las demás filas, con «Empezar» (o, si ya entrenaste, hecha), nada si hoy descansas,
 * tu racha y lo de mañana. Sin rutina, elegir una.
 */
export function useHoyDeEntreno(): HoyDeEntreno {
  useEffect(() => {
    void cargarPlan()
  }, [])
  const plan = tuPlan.value
  if (plan.status === 'loading')
    return { listo: false, tareas: [], descansas: false, racha: null, manana: null, records: [] }
  if (plan.status === 'none')
    return {
      listo: true,
      tareas: [
        {
          id: 'entreno',
          orden: ORDEN_TAREA.entreno,
          icono: 'entreno',
          titulo: 'Elige tu rutina',
          corta: 'elegir tu rutina',
          detalle: 'Para saber qué entrenas cada día',
          hecha: false,
          href: paths.chooseRoutine,
        },
      ],
      descansas: false,
      racha: null,
      manana: null,
      records: [],
    }
  const hoy = localDate()
  const deHoy = entrenos.value.filter((x) => x.fecha === hoy)
  const toca = tocaHoy.value
  const descansa = !deHoy.length && descansasHoy(hoy)
  const tareas: TareaDeHoy[] = []
  if (deHoy.length) {
    const ultimo = deHoy.reduce((a, b) => (a.inicio > b.inicio ? a : b))
    const min = Math.max(1, Math.round(deHoy.reduce((n, x) => n + x.segundos, 0) / 60))
    tareas.push({
      id: 'entreno',
      orden: ORDEN_TAREA.entreno,
      icono: 'entreno',
      titulo: `Entrena ${deHoy.map((x) => x.sigla).join(' y ')}`,
      corta: 'entrenar',
      detalle: `${min} min`,
      hecha: true,
      // Hecho: abre ese día en Progreso (lo que hiciste, serie a serie), con «‹» de vuelta a Hoy
      href: paths.progressDay(ultimo.fecha),
    })
  } else if (!descansa && toca)
    tareas.push({
      id: 'entreno',
      orden: ORDEN_TAREA.entreno,
      icono: 'entreno',
      titulo: `${toca.sigla} · ${toca.nombre}`,
      corta: 'entrenar',
      detalle: `Entrena · ${toca.minutos} min`,
      hecha: false,
      boton: 'Empezar',
      // Abre Ver sesión (sus ejercicios y su progreso); desde ahí, «Empezar» y la flecha atrás vuelve a Hoy
      href: paths.sessionView(toca.sigla.toLowerCase()),
    })
  const racha = diasDeRacha(
    entrenos.value.filter((x) => x.programId === plan.programId).map((x) => x.fecha),
    descansosPorSemana.value,
    hoy,
  )
  // Mañana: si hoy ya entrenaste (o descansas), la que toca es la de mañana, salvo que mañana toque descanso
  const manana = descansasHoy(addDays(hoy, 1)) ? 'Descansas' : toca ? `${toca.sigla} · ${toca.nombre}` : null
  const records = recordsDelDia(hoy, entrenos.value, claveEjercicio.value).map((r) => r.nombre)
  return { listo: true, tareas, descansas: descansa, racha: racha || null, manana, records }
}
