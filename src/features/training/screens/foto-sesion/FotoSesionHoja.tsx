import { useState } from 'preact/hooks'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { SessionPhotoSheet } from '../../components/SessionPhotoSheet.tsx'
import { fotosSesion } from '../../state/fotos.ts'
import { nombresDeSesiones, sesiones, tuPlan } from '../../state/plan.ts'
import { ponerFoto, quitarFoto } from '../../use-cases/sessionPhotos.ts'

/** Foto de la sesión (desde «Tu rutina»): empieza en la sesión que se ve en el carrusel (`sigla`). */
export function FotoSesionHoja(props: { sigla: string; onClose: () => void }) {
  const lista = sesiones.value
  const [sigla, setSigla] = useState(props.sigla || lista[0]?.sigla || '')
  const [aviso, setAviso] = useState<string | null>(null)
  const plan = tuPlan.value
  if (plan.status !== 'ready') return null
  const titulos = nombresDeSesiones(lista)
  const decir = (t: string) => {
    setAviso(t)
    setTimeout(() => setAviso(null), 2500)
  }
  return (
    <>
      <SessionPhotoSheet
        sesiones={lista.map((s) => ({ value: s.sigla, label: titulos[s.sigla] }))}
        sigla={sigla}
        onSigla={setSigla}
        foto={fotosSesion.value[sigla] ?? null}
        onFoto={(archivo) =>
          void ponerFoto(plan.programId, sigla, archivo).then((ok) =>
            decir(ok ? 'Foto puesta' : 'No se pudo leer esa imagen'),
          )
        }
        onQuitar={() => void quitarFoto(plan.programId, sigla).then(() => decir('Foto quitada'))}
        onClose={props.onClose}
      />
      <Toast message={aviso} />
    </>
  )
}
