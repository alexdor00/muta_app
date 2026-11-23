// Lo que cambias de tu plan (ejercicios cambiados por otros, ediciones de cada sesión, nombres, días de descanso, el orden
// de tu semana y las sesiones que añadiste): vive aquí en memoria, se aplica al montar tu semana (training.ts) y se guarda
// en `plans/current` en cola. Las acciones que lo cambian están en editPlan.ts.
import { getDb } from '../../../shared/data/db.ts'
import type { MuscleId } from '../domain/muscles.ts'
import type { PriorityChoice } from '../domain/priorities.ts'
import type { Ediciones } from '../domain/routineEdit.ts'
import type { WeakChoice } from '../domain/weakPoints.ts'
import type { SesionPropia } from '../domain/weekOrder.ts'
import { elecciones, type EleccionMusculo } from '../state/musculos.ts'
import { descansosElegidos } from '../state/sesionEnCurso.ts'

/** El plan guardado (`plans/current`): la rutina con tus elecciones y lo que cambias desde la sesión y las fichas. */
export type PlanGuardado = {
  id: 'current'
  programId: string
  weakPoints?: WeakChoice | null
  priorities?: PriorityChoice | null
  /** Descanso elegido por ejercicio (segundos), para todas las sesiones. */
  descansos?: Record<string, number>
  /** Mantener · Desarrollar · Prioridad o a mano, por músculo. */
  musculos?: Partial<Record<MuscleId, EleccionMusculo>>
  /** Ejercicios que cambiaste en tu plan: nombre en la rutina → el que lo sustituye. */
  cambios?: Record<string, string>
  /** Lo que cambias en cada sesión desde Editar rutina (orden, quitar, añadir y pauta), por sigla. */
  ediciones?: Ediciones
  /** El nombre que le pusiste a cada sesión en Editar rutina, por sigla. */
  nombres?: Record<string, string>
  /** Descansos obligatorios cambiados en Editar rutina: tras qué sesiones van (sin esto, los de la rutina). */
  descansosTras?: number[]
  /** El orden de tu semana en Editar rutina, por sigla (sin esto, el de la rutina). */
  ordenSemana?: string[]
  /** Las sesiones que añadiste en Editar rutina (empiezan vacías; sus ejercicios, en `ediciones`). */
  propias?: SesionPropia[]
}

/** Lo editado de tu plan, en memoria (lo cargan `cargarEditado` y las acciones de editPlan.ts). */
export const editado: {
  /** Ejercicios que cambiaste: nombre en la rutina → el que lo sustituye. */
  cambios: Record<string, string>
  /** Lo que editaste en cada sesión, por sigla. */
  ediciones: Ediciones
  /** Los nombres que pusiste a tus sesiones. */
  nombres: Record<string, string>
  /** Los descansos obligatorios que cambiaste (null: los de la rutina). */
  descansosTras: number[] | null
  /** El orden de tu semana (null: el de la rutina). */
  ordenSemana: string[] | null
  /** Las sesiones que añadiste. */
  propias: SesionPropia[]
} = { cambios: {}, ediciones: {}, nombres: {}, descansosTras: null, ordenSemana: null, propias: [] }

/** Lo editado, tal como está guardado en tu plan. */
export function cargarEditado(plan: PlanGuardado): void {
  editado.cambios = plan.cambios ?? {}
  editado.ediciones = plan.ediciones ?? {}
  editado.nombres = plan.nombres ?? {}
  editado.descansosTras = plan.descansosTras ?? null
  editado.ordenSemana = plan.ordenSemana ?? null
  editado.propias = plan.propias ?? []
}

// Las escrituras del plan van en cola y cada una guarda lo último de todo (descansos, músculos, cambios y ediciones):
// dos cambios casi a la vez no se pisan.
let cola: Promise<void> = Promise.resolve()

export function guardarEnPlan(): Promise<void> {
  const escribir = async () => {
    const db = await getDb()
    const plan = (await db.get('plans', 'current')) as PlanGuardado | undefined
    if (!plan) return
    await db.put('plans', {
      ...plan,
      descansos: descansosElegidos.value,
      musculos: elecciones.value,
      cambios: editado.cambios,
      ediciones: editado.ediciones,
      nombres: editado.nombres,
      descansosTras: editado.descansosTras ?? undefined,
      ordenSemana: editado.ordenSemana ?? undefined,
      propias: editado.propias,
    })
  }
  cola = cola.then(escribir, escribir)
  return cola
}
