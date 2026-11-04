import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ExerciseLibrarySheet } from '../../components/ExerciseLibrarySheet.tsx'
import {
  libraryLine,
  MUSCLE_IDS,
  MUSCLES,
  type LibraryExercise,
  type MuscleId,
} from '../../state/routines.ts'
import { buscarEjercicios, ejercicioDeBiblioteca } from '../../use-cases/exerciseLibrary.ts'
import { segunTuMaterial } from '../../use-cases/myEquipment.ts'

const FILTRO = MUSCLE_IDS.map((id) => ({ id, label: MUSCLES[id].label }))

type Props = {
  onClose: () => void
  /** Sin él, la biblioteca (A16): tocar un ejercicio abre su ficha. Con él, «Elegir ejercicio» (C19): se elige con +. */
  onElegir?: (ejercicio: LibraryExercise) => void
  /** Músculo con el que empieza filtrada (al cambiar un ejercicio, el suyo). */
  musculo?: MuscleId | null
}

/** La biblioteca de ejercicios, para verla (desde «Tu rutina») o para elegir uno (en la sesión). */
export function BibliotecaHoja({ onClose, onElegir, musculo = null }: Props) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleId | null>(musculo)
  // Lo que no se hace con tu material, al final y en gris (se puede elegir igual)
  const { tienes, noTienes } = segunTuMaterial(buscarEjercicios(query, muscle), (e) => e.equipment)
  const fila = (e: LibraryExercise, falta: boolean) => ({
    id: e.id,
    name: e.name,
    line: libraryLine(e),
    noTienes: falta,
  })
  const rows = [...tienes.map((e) => fila(e, false)), ...noTienes.map((e) => fila(e, true))]
  return (
    <ExerciseLibrarySheet
      title={onElegir ? 'Elegir ejercicio' : 'Biblioteca de ejercicios'}
      query={query}
      onQuery={setQuery}
      muscles={FILTRO}
      muscle={muscle}
      onMuscle={setMuscle}
      rows={rows}
      hrefOf={onElegir ? undefined : (id) => paths.exercise(id)}
      onPick={
        onElegir &&
        ((id) => {
          const e = ejercicioDeBiblioteca(id)
          if (e) onElegir(e)
        })
      }
      onClose={onClose}
    />
  )
}
