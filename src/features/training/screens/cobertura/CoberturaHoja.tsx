import { useState } from 'preact/hooks'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { CoverageSheet } from '../../components/CoverageSheet.tsx'
import { sesiones } from '../../state/plan.ts'
import { MUSCLES, type LibraryExercise } from '../../state/routines.ts'
import { coberturaDelPlan } from '../../use-cases/coverage.ts'
import { ejercicioDeBiblioteca } from '../../use-cases/exerciseLibrary.ts'
import { ElegirSesionHoja } from '../comun/ElegirSesionHoja.tsx'

/** Minúscula al principio: «Pide un inclinado…». */
const enFrase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * Cobertura muscular (desde «Tu rutina»): lo que pide el método para cada músculo frente a tus sesiones; «+» elige la sesión
 * y añade el ejercicio para todas las semanas.
 */
export function CoberturaHoja({ onClose }: { onClose: () => void }) {
  const [anadiendo, setAnadiendo] = useState<LibraryExercise | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  if (anadiendo) {
    return (
      <ElegirSesionHoja
        ejercicio={anadiendo}
        onHecho={(sesion) => {
          setAviso(`${anadiendo.name} añadido a ${sesion}`)
          setTimeout(() => setAviso(null), 2500)
          setAnadiendo(null)
        }}
        onClose={() => setAnadiendo(null)}
      />
    )
  }
  const { porRevisar, bien } = coberturaDelPlan(sesiones.value)
  return (
    <>
      <CoverageSheet
        faltas={porRevisar.flatMap((r) =>
          r.faltan.map((p) => ({
            titulo: `${MUSCLES[r.musculo].label}: ${p.falta}`,
            pide: `Pide ${enFrase(r.pide)}.`,
            sugiere: p.sugiere.map((s) => ({ id: s.id, nombre: s.name })),
          })),
        )}
        bien={bien.map((r) => `${MUSCLES[r.musculo].label} · ${enFrase(r.pide)}`)}
        onAnadir={(id) => setAnadiendo(ejercicioDeBiblioteca(id))}
        onClose={onClose}
      />
      <Toast message={aviso} />
    </>
  )
}
