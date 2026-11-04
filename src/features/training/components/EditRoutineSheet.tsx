import { useRef, useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import {
  CameraIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripIcon,
  PencilIcon,
  PlusIcon,
} from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './EditRoutineSheet.module.css'

export type FilaEditar = {
  nombre: string
  /** «3 × 6–10 · 3:00». */
  detalle: string
  /** «En lugar de …» si lo cambiaste por otro, o «Añadido por ti». */
  nota: string | null
  /** En superserie: el primero, uno de en medio o el último (null si va solo). */
  superserie: 'inicio' | 'medio' | 'fin' | null
}

/**
 * Editar rutina (A11), una sesión: «‹ Tu semana» para volver, su foto, su nombre (el lápiz lo cambia), los consejos del
 * entrenador en una fila que abre su hoja y sus ejercicios (tocar uno lo edita; su asa, o las flechas sobre ella, lo mueve).
 * «Añadir ejercicio» y volver esta sesión a la original.
 */
export function EditRoutineSheet(props: {
  /** El nombre de la sesión («Torso 1»). */
  nombre: string
  /** «‹ Tu semana»: vuelve a la lista de la semana. */
  onSemana: () => void
  foto: string | null
  onFoto: () => void
  onRenombrar: (nombre: string) => void
  /** Cuántos consejos tiene el entrenador para esta sesión (0: no sale la fila). */
  consejos: number
  onConsejos: () => void
  filas: FilaEditar[]
  onAbrir: (i: number) => void
  onMover: (de: number, a: number) => void
  onAnadir: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const lista = useRef<HTMLOListElement>(null)
  const [arrastre, setArrastre] = useState<{ de: number; a: number } | null>(null)
  const [renombrando, setRenombrando] = useState<string | null>(null)
  const nombre = props.nombre

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

  const guardarNombre = () => {
    if (renombrando !== null && renombrando.trim() && renombrando.trim() !== nombre)
      props.onRenombrar(renombrando.trim())
    setRenombrando(null)
  }

  return (
    <Sheet title="Editar rutina" onClose={props.onClose} large>
      <button type="button" class={styles.back} onClick={props.onSemana}>
        <ChevronLeftIcon />
        Tu semana
      </button>

      <div class={styles.head}>
        <button
          type="button"
          class={styles.thumb}
          aria-label={props.foto ? `Cambiar la foto de ${nombre}` : `Añadir una foto a ${nombre}`}
          onClick={props.onFoto}
        >
          {props.foto ? <img src={props.foto} alt="" /> : <CameraIcon />}
        </button>
        {renombrando !== null ? (
          <input
            class={styles.nameInput}
            aria-label="Nombre de la sesión"
            value={renombrando}
            maxLength={40}
            ref={(el) => el?.focus()}
            onInput={(e) => setRenombrando(e.currentTarget.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardarNombre()
              if (e.key === 'Escape') setRenombrando(null)
            }}
          />
        ) : (
          <>
            <h3 class={styles.title}>{nombre}</h3>
            <button
              type="button"
              class={styles.rename}
              aria-label={`Cambiar el nombre de ${nombre}`}
              onClick={() => setRenombrando(nombre)}
            >
              <PencilIcon />
            </button>
          </>
        )}
      </div>

      {props.consejos > 0 && (
        <button type="button" class={styles.coach} onClick={props.onConsejos}>
          <ChatIcon />
          <span>
            {props.consejos === 1 ? '1 consejo del entrenador' : `${props.consejos} consejos del entrenador`}
          </span>
          <ChevronRightIcon />
        </button>
      )}

      <ol ref={lista} class={styles.list} aria-label={`Ejercicios de ${nombre}`}>
        {orden.map((i) => {
          const f = props.filas[i]
          return (
            <li
              key={f.nombre}
              class={`${arrastre?.de === i ? styles.lifted : ''} ${f.superserie ? styles.joined : ''}`}
            >
              <button type="button" class={styles.row} onClick={() => props.onAbrir(i)}>
                {f.superserie === 'inicio' && <span class={styles.ssLabel}>Superserie</span>}
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
        Volver esta sesión a la original
      </button>
    </Sheet>
  )
}
