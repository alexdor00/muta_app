import { useRef, useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './EditRoutineSheet.module.css'

export type FilaEditar = {
  nombre: string
  /** «3 series de 6–10, a 2 del fallo, 3:00». */
  detalle: string
  /** «En lugar de …» si lo cambiaste por otro, o «Añadido por ti». */
  nota: string | null
}

/** Lo que hay que mantener pulsada una fila para empezar a moverla. */
const MANTENER_MS = 350

/**
 * Editar rutina (A11): la sesión elegida con sus ejercicios (número, nombre y pauta). Tocar uno lo edita; mantenerlo
 * pulsado y arrastrar lo cambia de sitio. «Añadir ejercicio» y volver a la rutina original.
 */
export function EditRoutineSheet(props: {
  sesiones: { value: string; label: string }[]
  sigla: string
  onSigla: (sigla: string) => void
  filas: FilaEditar[]
  onAbrir: (i: number) => void
  onMover: (de: number, a: number) => void
  onAnadir: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const lista = useRef<HTMLOListElement>(null)
  const [arrastre, setArrastre] = useState<{ de: number; a: number } | null>(null)
  const pulsado = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Tras mover, el toque que suelta no abre el ejercicio
  const recienMovido = useRef(false)

  // Mientras se arrastra, la lista se ve ya con el ejercicio en su sitio nuevo
  const orden = props.filas.map((_, i) => i)
  if (arrastre) {
    const [x] = orden.splice(arrastre.de, 1)
    orden.splice(arrastre.a, 0, x)
  }

  const puestoEn = (y: number) => {
    const filas = [...(lista.current?.children ?? [])]
    const i = filas.findIndex((f) => {
      const r = f.getBoundingClientRect()
      return y < r.top + r.height / 2
    })
    return i < 0 ? filas.length - 1 : i
  }

  return (
    <Sheet title="Editar rutina" onClose={props.onClose} large>
      <ChoiceChips
        name="sesion-editar"
        legend="Sesión"
        options={props.sesiones}
        value={props.sigla}
        onChange={props.onSigla}
      />
      <ol ref={lista} class={styles.list} aria-label={`Ejercicios de ${props.sigla}`}>
        {orden.map((i, puesto) => {
          const f = props.filas[i]
          return (
            <li key={f.nombre} class={arrastre?.de === i ? styles.lifted : ''}>
              <button
                type="button"
                class={styles.row}
                onPointerDown={(e) => {
                  const fila = e.currentTarget
                  const id = e.pointerId
                  clearTimeout(pulsado.current)
                  pulsado.current = setTimeout(() => {
                    fila.setPointerCapture(id)
                    setArrastre({ de: i, a: i })
                  }, MANTENER_MS)
                }}
                onPointerMove={(e) => {
                  if (arrastre) setArrastre({ ...arrastre, a: puestoEn(e.clientY) })
                }}
                onPointerUp={() => {
                  clearTimeout(pulsado.current)
                  if (!arrastre) return
                  if (arrastre.a !== arrastre.de) props.onMover(arrastre.de, arrastre.a)
                  recienMovido.current = true
                  setTimeout(() => (recienMovido.current = false), 0)
                  setArrastre(null)
                }}
                onPointerCancel={() => {
                  clearTimeout(pulsado.current)
                  setArrastre(null)
                }}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => !recienMovido.current && props.onAbrir(i)}
              >
                <span class={styles.number}>{puesto + 1}</span>
                <span class={styles.text}>
                  <span class={styles.name}>{f.nombre}</span>
                  <span class={styles.detail}>{f.detalle}</span>
                  {f.nota && <span class={styles.note}>{f.nota}</span>}
                </span>
                <span class={styles.chevron} aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <p class={styles.hint}>
        Mantén pulsado un ejercicio para cambiarlo de sitio. Los cambios se guardan en tu plan, para todas las
        semanas.
      </p>
      <Button onClick={props.onAnadir}>
        <span class={styles.add}>
          <PlusIcon />
          Añadir ejercicio
        </span>
      </Button>
      <button type="button" class={styles.restore} onClick={props.onVolver}>
        Volver a la rutina original
      </button>
    </Sheet>
  )
}
