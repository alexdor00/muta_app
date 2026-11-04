import { useState } from 'preact/hooks'
import { ExerciseMoreSheet } from '../../components/ExerciseMoreSheet.tsx'
import { SwapSheet } from '../../components/SwapSheet.tsx'
import type { LibraryExercise } from '../../state/routines.ts'
import { cambiarEjercicioDelPlan, enTuPlan } from '../../use-cases/changeExercise.ts'
import { equivalentesDe } from '../../use-cases/exerciseLibrary.ts'
import { fueraDeTuMaterial } from '../../use-cases/myEquipment.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { ElegirSesionHoja } from '../comun/ElegirSesionHoja.tsx'

/** Lo que se ve después de añadir o cambiar: el aviso y, si se puede, cómo deshacerlo. */
export type AvisoFicha = { texto: string; deshacer?: () => void }

/**
 * El «···» de la ficha: añadir el ejercicio a una sesión de tu plan (al final, para todas las semanas) o, si ya está en
 * tu plan, cambiarlo por otro (la misma hoja que en Editar rutina, con la biblioteca para elegir cualquiera).
 */
export function MasFichaHoja(props: {
  ejercicio: LibraryExercise
  onAviso: (aviso: AvisoFicha) => void
  onClose: () => void
}) {
  const ex = props.ejercicio
  const [hoja, setHoja] = useState<'menu' | 'sesion' | 'cambiar' | 'biblioteca'>('menu')
  const donde = enTuPlan(ex.id)
  const cambiar = (nuevo: string) => {
    if (!donde) return
    cambiarEjercicioDelPlan(donde.sigla, donde.ejercicios, donde.e, nuevo)
    props.onAviso({
      texto:
        nuevo === donde.e.enLugarDe ? `Vuelves a ${nuevo} en tu plan` : `Cambiado por ${nuevo} en tu plan`,
    })
    props.onClose()
  }

  if (hoja === 'sesion') {
    return (
      <ElegirSesionHoja
        ejercicio={ex}
        onHecho={(titulo, deshacer) => {
          props.onAviso({
            texto: deshacer ? `Añadido al final de ${titulo}` : `Ya está en ${titulo}`,
            deshacer,
          })
          props.onClose()
        }}
        onClose={props.onClose}
      />
    )
  }
  if (hoja === 'cambiar' && donde) {
    const equivalentes = equivalentesDe(donde.e).map((q) => ({ nombre: q.ex.name, motivo: q.motivo }))
    return (
      <SwapSheet
        soloPlan
        equivalentes={equivalentes}
        sustitutos={donde.e.sustitutos}
        noTienes={fueraDeTuMaterial([...equivalentes.map((q) => q.nombre), ...donde.e.sustitutos])}
        enLugarDe={donde.e.enLugarDe ?? null}
        onElegir={cambiar}
        onBiblioteca={() => setHoja('biblioteca')}
        onClose={props.onClose}
      />
    )
  }
  if (hoja === 'biblioteca') {
    return (
      <BibliotecaHoja musculo={ex.primary} onElegir={(otro) => cambiar(otro.name)} onClose={props.onClose} />
    )
  }
  return (
    <ExerciseMoreSheet
      titulo={ex.name}
      onAnadir={() => setHoja('sesion')}
      onCambiar={donde ? () => setHoja('cambiar') : undefined}
      onClose={props.onClose}
    />
  )
}
