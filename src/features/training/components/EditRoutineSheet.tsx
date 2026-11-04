import { useRef, useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import {
  CameraIcon,
  ChatIcon,
  ChevronRightIcon,
  GripIcon,
  MoonIcon,
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
}

/** Hasta cuántos días de descanso seguidos se pueden poner tras una sesión: el hueco va de 0 a esto y vuelve a 0. */
const MAX_DESCANSOS = 2

/**
 * Editar rutina (A11): arriba, «Tu semana» con las sesiones (tocar una la elige) y sus descansos (tocar el hueco de
 * después pone 1, 2 o ninguno). Debajo, la sesión elegida: su foto, su nombre (el lápiz lo cambia), los consejos del
 * entrenador en una fila que abre su hoja, y sus ejercicios (tocar uno lo edita; su asa, o las flechas sobre ella, lo
 * mueve). «Añadir ejercicio» y volver a la rutina original.
 */
export function EditRoutineSheet(props: {
  /** `label`: el nombre («Torso 1»); `corto`: lo que cabe en la tira («T1»). */
  sesiones: { value: string; label: string; corto: string }[]
  sigla: string
  onSigla: (sigla: string) => void
  /** Días de descanso tras cada sesión, en el orden de `sesiones`. */
  descansos: number[]
  onDescansos: (porSesion: number[]) => void
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

  const guardarNombre = () => {
    if (renombrando !== null && renombrando.trim() && renombrando.trim() !== nombre)
      props.onRenombrar(renombrando.trim())
    setRenombrando(null)
  }

  return (
    <Sheet title="Editar rutina" onClose={props.onClose} large>
      <section class={styles.week} aria-labelledby="tu-semana-editar">
        <h3 id="tu-semana-editar" class={styles.eyebrow}>
          Tu semana
        </h3>
        <ol class={styles.strip}>
          {props.sesiones.map((s, i) => {
            const n = props.descansos[i] ?? 0
            return (
              <li key={s.value}>
                <button
                  type="button"
                  class={`${styles.pill} ${s.value === props.sigla ? styles.on : ''}`}
                  aria-pressed={s.value === props.sigla}
                  aria-label={s.label}
                  onClick={() => props.onSigla(s.value)}
                >
                  {s.corto}
                </button>
                <button
                  type="button"
                  class={`${styles.gap} ${n ? styles.rest : ''}`}
                  aria-label={`Descanso tras ${s.label}: ${n === 0 ? 'ninguno' : n === 1 ? '1 día' : `${n} días`}`}
                  onClick={() =>
                    props.onDescansos(
                      props.descansos.map((x, j) => (j === i ? (n + 1) % (MAX_DESCANSOS + 1) : x)),
                    )
                  }
                >
                  {n === 0 ? (
                    <span class={styles.dot} />
                  ) : (
                    Array.from({ length: n }, (_, k) => <MoonIcon key={k} />)
                  )}
                </button>
              </li>
            )
          })}
        </ol>
        <p class={styles.hint}>
          Toca una sesión para editarla y el hueco de después para poner o quitar un descanso.
        </p>
      </section>

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
