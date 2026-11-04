import { useState } from 'preact/hooks'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { CameraIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Desplegable } from './Desplegable.tsx'
import styles from './SessionPhotoSheet.module.css'

/**
 * Foto de la sesión (A29–A30): la sesión (desplegable), cómo queda la tarjeta, elegir de la galería o hacer una foto y
 * quitarla. Se guarda sola, solo en el móvil.
 */
export function SessionPhotoSheet(props: {
  sesiones: { value: string; label: string }[]
  sigla: string
  onSigla: (sigla: string) => void
  foto: string | null
  onFoto: (archivo: File) => void
  onQuitar: () => void
  onClose: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  const nombre = props.sesiones.find((s) => s.value === props.sigla)?.label ?? props.sigla
  const elegir = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const archivo = input.files?.[0]
    if (archivo) props.onFoto(archivo)
    input.value = ''
  }
  return (
    <Sheet title="Foto de la sesión" onClose={props.onClose} large>
      <Desplegable titulo="Sesión" valor={nombre} abierto={abierto} onAbrir={setAbierto}>
        <ChoiceList
          name="foto-sesion"
          legend="Sesión"
          options={props.sesiones}
          value={props.sigla}
          onChange={(s) => {
            props.onSigla(s)
            setAbierto(false)
          }}
        />
      </Desplegable>
      <div class={`${styles.preview} ${props.foto ? styles.withPhoto : ''}`}>
        {props.foto ? (
          <img src={props.foto} alt={`Tu foto de ${nombre}`} />
        ) : (
          <span class={styles.empty}>
            <CameraIcon />
            Sin foto: la tarjeta va con su color
          </span>
        )}
        <span class={styles.name}>
          <b>{props.sigla}</b> {nombre}
        </span>
      </div>
      <label class={styles.primary}>
        Elegir de la galería
        <input type="file" accept="image/*" onChange={elegir} />
      </label>
      <label class={styles.secondary}>
        Hacer una foto
        <input type="file" accept="image/*" capture="environment" onChange={elegir} />
      </label>
      {props.foto && (
        <button type="button" class={styles.remove} onClick={props.onQuitar}>
          Quitar la foto
        </button>
      )}
      <p class={styles.note}>
        Se guarda solo en tu móvil. La tarjeta de Tu plan la lleva de fondo, oscurecida para que se lea.
      </p>
    </Sheet>
  )
}
