// «Tu semana» de Editar rutina: las filas que se pintan (cada sesión con su nombre, sus ejercicios y si es tuya; los días de
// descanso detrás) a partir de tu semana y sus descansos.
import type { FilaTuSemana } from '../../components/EditWeekSheet.tsx'
import { filasDeSemana, type FilaSemana, type SesionPlan } from '../../state/plan.ts'
import { esPropia } from '../../use-cases/editPlan.ts'

/**
 * Las filas de tu semana (`filas`, para moverlas y guardarlas) y lo que se pinta de cada una (`semana`). `marcados`: los
 * ejercicios de una sesión que entrenan el músculo del entrenador (vacío si no llega con uno).
 */
export function semanaParaEditar(
  lista: readonly SesionPlan[],
  titulos: Record<string, string>,
  porSesion: readonly number[],
  marcados: (sigla: string) => string[],
): { filas: FilaSemana[]; semana: FilaTuSemana[] } {
  const filas = filasDeSemana(
    lista.map((x) => x.sigla),
    porSesion,
  )
  const semana = filas.map((f): FilaTuSemana => {
    if (f.tipo === 'descanso') return f
    const x = lista.find((s) => s.sigla === f.sigla)
    return {
      tipo: 'sesion',
      sigla: f.sigla,
      nombre: titulos[f.sigla],
      ejercicios: x?.ejercicios.length ?? 0,
      propia: esPropia(f.sigla),
      marca: marcados(f.sigla).join(' · ') || null,
    }
  })
  return { filas, semana }
}

/** Desde «Tu entrenador», lo que dice arriba de tu semana: dónde se entrena ese músculo (null si no llega con uno). */
export function guiaDeLaSemana(musculo: string, loEntrenan: boolean): string | null {
  if (!musculo) return null
  return loEntrenan
    ? `${musculo}: se entrena en las sesiones marcadas. Toca una y cambia las series del ejercicio marcado.`
    : `${musculo}: ninguna sesión lo entrena directo. Toca una y añade un ejercicio.`
}
