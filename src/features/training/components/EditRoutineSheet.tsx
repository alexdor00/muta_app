import { useRef, useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../shared/ui/Choice.tsx'
import { GripIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './EditRoutineSheet.module.css'

export type FilaEditar = {
  nombre: string
  /** «3 × 6–10 · 3:00». */
  detalle: string
  /** «En lugar de …» si lo cambiaste por otro, o «Añadido por ti». */
  nota: string | null
}

/** Lo que dice el entrenador: uno cada vez, en gris; «Vale» lo oculta. */
export function ConsejoEntrenador(props: { texto: string; onVale: () => void }) {
  return (
    <div class={styles.tip} role="note" aria-label="Consejo del entrenador">
      <p>{props.texto}</p>
      <button type="button" onClick={props.onVale}>
        Vale
      </button>
    </div>
  )
}

/**
 * Editar rutina (A11): las sesiones por su nombre y la elegida con sus ejercicios (nombre y pauta). Tocar uno lo edita;
 * arrastrar su asa (o, con el teclado, flechas sobre ella) lo cambia de sitio. Un consejo del entrenador como mucho,
 * «Añadir ejercicio» y volver a la rutina original.
 */
export function EditRoutineSheet(props: {
  /** `label`: el nombre de la sesión («Tirón #1 (dorsal)»). */
  sesiones: { value: string; label: string }[]
  sigla: string
  onSigla: (sigla: string) => void
  filas: FilaEditar[]
  consejo: string | null
  onVale: () => void
  onAbrir: (i: number) => void
  onMover: (de: number, a: number) => void
  onAnadir: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const lista = useRef<HTMLOListElement>(null)
  const [arrastre, setArrastre] = useState<{ de: number; a: number } | null>(null)
  const nombre = props.sesiones.find((s) => s.value === props.sigla)?.label ?? props.sigla

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
      {props.consejo && <ConsejoEntrenador texto={props.consejo} onVale={props.onVale} />}
      <ol ref={lista} class={styles.list} aria-label={`Ejercicios de ${nombre}`}>
        {orden.map((i) => {
          const f = props.filas[i]
          return (
            <li key={f.nombre} class={arrastre?.de === i ? styles.lifted : ''}>
              <button type="button" class={styles.row} onClick={() => props.onAbrir(i)}>
                <span class={styles.name}>{f.nombre}</span>
                <span class={styles.detail}>{f.detalle}</span>
                {f.nota && <span class={styles.note}>{f.nota}</span>}
              </button>
              <button
                type="button"
                class={styles.handle}
                aria-label={`Mover ${f.nombre}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  setArrastre({ de: i, a: i })
                }}
                onPointerMove={(e) => {
                  if (arrastre) setArrastre({ ...arrastre, a: puestoEn(e.clientY) })
                }}
                onPointerUp={() => {
                  if (arrastre && arrastre.a !== arrastre.de) props.onMover(arrastre.de, arrastre.a)
                  setArrastre(null)
                }}
                onPointerCancel={() => setArrastre(null)}
                onKeyDown={(e) => {
                  const a = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null
                  if (a === null || a < 0 || a >= props.filas.length) return
                  e.preventDefault()
                  props.onMover(i, a)
                }}
              >
                <GripIcon />
              </button>
            </li>
          )
        })}
      </ol>
      <div class={styles.add}>
        <Button onClick={props.onAnadir}>
          <span class={styles.addLabel}>
            <PlusIcon />
            Añadir ejercicio
          </span>
        </Button>
      </div>
      <button type="button" class={styles.restore} onClick={props.onVolver}>
        Volver a la rutina original
      </button>
    </Sheet>
  )
}
