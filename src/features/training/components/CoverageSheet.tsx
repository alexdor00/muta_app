import { useState } from 'preact/hooks'
import { PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Desplegable } from './Desplegable.tsx'
import styles from './CoverageSheet.module.css'

export type FaltaVista = {
  /** «Glúteo: falta abducción». */
  titulo: string
  /** «Pide acortado, estirado y abducción». */
  pide: string
  sugiere: { id: string; nombre: string }[]
}

/**
 * Cobertura muscular (A26–A27): lo que le falta a tu plan según el método, numerado, con los ejercicios que lo cubren
 * («+» lo añade a una sesión), y los músculos bien cubiertos en un desplegable.
 */
export function CoverageSheet(props: {
  faltas: FaltaVista[]
  /** «Pecho · un inclinado y trabajo horizontal». */
  bien: string[]
  onAnadir: (id: string) => void
  onClose: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <Sheet title="Cobertura muscular" onClose={props.onClose} large>
      <p class={styles.lead}>Tu plan frente a lo que pide el método para cada músculo. Son sugerencias.</p>
      {props.faltas.length ? (
        <ol class={styles.list} aria-label="Por revisar">
          {props.faltas.map((f, i) => (
            <li key={f.titulo}>
              <span class={styles.num} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div class={styles.text}>
                <p class={styles.title}>{f.titulo}</p>
                <p class={styles.ask}>{f.pide}</p>
                <div class={styles.chips}>
                  {f.sugiere.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      class={styles.chip}
                      aria-label={`Añadir ${s.nombre}`}
                      onClick={() => props.onAnadir(s.id)}
                    >
                      <PlusIcon />
                      {s.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p class={styles.ok}>Tu plan cubre todo lo que pide el método.</p>
      )}
      {props.bien.length > 0 && (
        <Desplegable
          titulo={`${props.bien.length} ${props.bien.length === 1 ? 'músculo bien cubierto' : 'músculos bien cubiertos'}`}
          valor=""
          abierto={abierto}
          onAbrir={setAbierto}
        >
          <ul class={styles.good}>
            {props.bien.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Desplegable>
      )}
    </Sheet>
  )
}
