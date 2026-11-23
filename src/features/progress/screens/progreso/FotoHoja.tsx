import { formatDayDate, formatShortDate } from '../../../../shared/lib/format.ts'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { fotos, POSES, type Pose } from '../../state/progreso.ts'
import { borrarFoto } from '../../use-cases/progress.ts'
import styles from './Progreso.module.css'

const nombreDe = (pose: Pose) => POSES.find((p) => p.id === pose)?.nombre ?? ''

/** Una foto en grande, con «Borrar esta foto». */
export function FotoHoja({
  id,
  onClose,
  avisar,
}: {
  id: string
  onClose: () => void
  avisar: (texto: string) => void
}) {
  const f = fotos.value.find((x) => x.id === id)
  if (!f) return null
  return (
    <Sheet title={`${nombreDe(f.pose)} · ${formatShortDate(f.date)}`} onClose={onClose} large>
      <div class={styles.hoja}>
        <img class={styles.fotoGrande} src={f.url} alt={`${nombreDe(f.pose)} del ${formatDayDate(f.date)}`} />
        <button
          type="button"
          class={styles.accion}
          onClick={() => {
            void borrarFoto(f.id)
            onClose()
            avisar('Foto borrada')
          }}
        >
          Borrar esta foto
        </button>
      </div>
    </Sheet>
  )
}
