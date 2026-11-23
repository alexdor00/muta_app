import { useState } from 'preact/hooks'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { FotoEditable } from '../../../shared/ui/FotoEditable.tsx'
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
  /** La foto de serie que lleva (si no pusiste la tuya). */
  deSerie: string
  /** Las siete fotos de la app para elegir: su nombre, dónde está y si es la que lleva. */
  fotosDeSerie: { foto: string; url: string; elegida: boolean }[]
  onDeSerie: (foto: string) => void
  /** Dónde está centrada (en %) y al soltar después de arrastrarla. */
  encuadre: { x: number; y: number }
  onCentrar: (x: number, y: number) => void
  onFoto: (archivo: File) => void
  onQuitar: () => void
  onClose: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  const nombre = props.sesiones.find((s) => s.value === props.sigla)?.label ?? props.sigla
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
      <FotoEditable
        foto={props.foto ?? props.deSerie}
        alt={props.foto ? `Tu foto de ${nombre}` : `Foto de ${nombre}`}
        encuadre={props.encuadre}
        onCentrar={props.onCentrar}
        onFoto={props.onFoto}
        onQuitar={props.foto ? props.onQuitar : undefined}
        entre={
          <>
            {/* Una de las siete de la app (usuario, 2026-11-14) */}
            <p class={styles.deSerieTitulo}>Fotos de la app</p>
            <div class={styles.deSerie} role="group" aria-label="Fotos de la app">
              {props.fotosDeSerie.map((f) => (
                <button
                  key={f.foto}
                  type="button"
                  class={`${styles.miniatura} ${f.elegida && !props.foto ? styles.miniaturaElegida : ''}`}
                  aria-pressed={f.elegida && !props.foto}
                  aria-label={`Poner la foto ${f.foto} de la app`}
                  onClick={() => props.onDeSerie(f.foto)}
                >
                  <img src={f.url} alt="" />
                </button>
              ))}
            </div>
          </>
        }
      >
        <span class={styles.name}>
          <b>{props.sigla}</b> {nombre}
        </span>
      </FotoEditable>
    </Sheet>
  )
}
