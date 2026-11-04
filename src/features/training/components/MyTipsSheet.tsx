import { useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import { PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../shared/ui/Switch.tsx'
import styles from './MyTipsSheet.module.css'

export type ConsejoFila = { clave: string; text: string; propio: boolean; oculto: boolean; editado: boolean }

/**
 * Mis consejos (A22–A25): los de antes de empezar con su interruptor (se ven o no); tocar el texto lo cambia, los tuyos se
 * pueden borrar y los de MUTA, volver al original. «Añadir mi consejo» y «Mostrar al empezar la sesión».
 */
export function MyTipsSheet(props: {
  consejos: ConsejoFila[]
  alEmpezar: boolean
  onAlEmpezar: (v: boolean) => void
  onVer: (clave: string, ver: boolean) => void
  onEditar: (clave: string, texto: string | null) => void
  onAnadir: (texto: string) => void
  onBorrar: (clave: string) => void
  onClose: () => void
}) {
  // Lo que se está escribiendo: un consejo (su clave) o uno nuevo («nuevo»)
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const abrir = (clave: string, actual: string) => {
    setEditando(clave)
    setTexto(actual)
  }
  const cerrar = () => setEditando(null)

  const editor = (c: ConsejoFila | null) => (
    <div class={styles.editor}>
      <textarea
        class={styles.input}
        aria-label={c ? 'Texto del consejo' : 'Tu consejo'}
        value={texto}
        placeholder="Escribe tu consejo"
        ref={(el) => el?.focus()}
        onInput={(e) => setTexto(e.currentTarget.value)}
      />
      <div class={styles.actions}>
        {c?.propio && (
          <button
            type="button"
            class={styles.danger}
            onClick={() => {
              props.onBorrar(c.clave)
              cerrar()
            }}
          >
            Borrar
          </button>
        )}
        {c?.editado && (
          <button
            type="button"
            onClick={() => {
              props.onEditar(c.clave, null)
              cerrar()
            }}
          >
            Volver al original
          </button>
        )}
        <span class={styles.spacer} />
        <button type="button" onClick={cerrar}>
          Cancelar
        </button>
        <Button
          onClick={() => {
            if (c) props.onEditar(c.clave, texto)
            else props.onAnadir(texto)
            cerrar()
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )

  return (
    <Sheet title="Mis consejos" onClose={props.onClose} large>
      <p class={styles.lead}>
        Los de «Antes de empezar»: apaga los que no quieras ver, toca uno para cambiarlo o añade los tuyos.
      </p>
      <ul class={styles.list} aria-label="Consejos de antes de empezar">
        {props.consejos.map((c) => (
          <li key={c.clave}>
            {editando === c.clave ? (
              editor(c)
            ) : (
              <div class={styles.row}>
                <button
                  type="button"
                  class={`${styles.text} ${c.oculto ? styles.off : ''}`}
                  aria-label={`Cambiar: ${c.text}`}
                  onClick={() => abrir(c.clave, c.text)}
                >
                  {c.text}
                  {(c.propio || c.editado) && <small>{c.propio ? 'Tuyo' : 'Cambiado'}</small>}
                </button>
                <Switch
                  label={`Ver: ${c.text}`}
                  soloLector
                  checked={!c.oculto}
                  onChange={(v) => props.onVer(c.clave, v)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {editando === 'nuevo' ? (
        editor(null)
      ) : (
        <button type="button" class={styles.add} onClick={() => abrir('nuevo', '')}>
          <PlusIcon />
          Añadir mi consejo
        </button>
      )}
      <div class={styles.start}>
        <Switch label="Mostrar al empezar la sesión" checked={props.alEmpezar} onChange={props.onAlEmpezar} />
      </div>
    </Sheet>
  )
}
