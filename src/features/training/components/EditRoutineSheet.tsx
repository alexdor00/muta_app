import { useRef, useState } from 'preact/hooks'
import { Button } from '../../../shared/ui/Button.tsx'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, GripIcon, MinusIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Desplegable } from './Desplegable.tsx'
import styles from './EditRoutineSheet.module.css'

export type FilaEditar = {
  nombre: string
  /** «3 × 6–10 · 3:00». */
  detalle: string
  /** «En lugar de …» si lo cambiaste por otro, o «Añadido por ti». */
  nota: string | null
}

/** Lo que dice el entrenador: uno cada vez, en gris; «Vale» lo oculta. Si se arregla con un toque, con su botón. */
export type Consejo = { texto: string; accion?: { label: string; onClick: () => void } }

export function ConsejoEntrenador(props: { consejo: Consejo; onVale: () => void }) {
  const { texto, accion } = props.consejo
  return (
    <div class={styles.tip} role="note" aria-label="Consejo del entrenador">
      <p>{texto}</p>
      <span class={styles.tipActions}>
        {accion && (
          <button type="button" class={styles.tipFix} onClick={accion.onClick}>
            {accion.label}
          </button>
        )}
        <button type="button" onClick={props.onVale}>
          Vale
        </button>
      </span>
    </div>
  )
}

/** Hasta cuántos días de descanso seguidos se pueden poner tras una sesión. */
const MAX_DESCANSOS = 2

/** «2 a la semana», «Ninguno». */
const textoDescansos = (n: number) => (n === 0 ? 'Ninguno' : `${n} a la semana`)

/**
 * Editar rutina (A11): las sesiones por su nombre (desplegable), los descansos obligatorios tras cada sesión
 * (desplegable) y la elegida con sus ejercicios (nombre y pauta). Tocar uno lo edita;
 * arrastrar su asa (o, con el teclado, flechas sobre ella) lo cambia de sitio. Un consejo del entrenador como mucho,
 * «Añadir ejercicio» y volver a la rutina original.
 */
export function EditRoutineSheet(props: {
  /** `label`: el nombre de la sesión («Tirón #1 (dorsal)»). */
  sesiones: { value: string; label: string }[]
  sigla: string
  onSigla: (sigla: string) => void
  filas: FilaEditar[]
  /** Días de descanso tras cada sesión, en el orden de `sesiones`. */
  descansos: number[]
  /** ¿Son otros que los de la rutina? */
  descansosCambiados: boolean
  onDescansos: (porSesion: number[]) => void
  onDescansosRutina: () => void
  consejo: Consejo | null
  onVale: () => void
  /** La foto de la sesión elegida: ¿tiene?, y abrir su hoja. */
  tieneFoto: boolean
  onFoto: () => void
  onAbrir: (i: number) => void
  onMover: (de: number, a: number) => void
  onAnadir: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const lista = useRef<HTMLOListElement>(null)
  const [arrastre, setArrastre] = useState<{ de: number; a: number } | null>(null)
  const [abierto, setAbierto] = useState<'sesion' | 'descansos' | null>(null)
  const total = props.descansos.reduce((n, x) => n + x, 0)
  const ponDescansos = (i: number, n: number) =>
    props.onDescansos(props.descansos.map((x, j) => (j === i ? n : x)))
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
      <Desplegable
        titulo="Sesión"
        valor={nombre}
        abierto={abierto === 'sesion'}
        onAbrir={(a) => setAbierto(a ? 'sesion' : null)}
      >
        <ChoiceList
          name="sesion-editar"
          legend="Sesión"
          options={props.sesiones}
          value={props.sigla}
          onChange={(s) => {
            props.onSigla(s)
            setAbierto(null)
          }}
        />
      </Desplegable>
      <Desplegable
        titulo="Descansos"
        valor={textoDescansos(total)}
        abierto={abierto === 'descansos'}
        onAbrir={(a) => setAbierto(a ? 'descansos' : null)}
      >
        <p class={styles.hint}>
          Días de descanso después de cada sesión:{' '}
          {props.descansosCambiados ? 'los has cambiado tú.' : 'los obligatorios de tu rutina.'}
        </p>
        <ul class={styles.rests} aria-label="Descansos tras cada sesión">
          {props.sesiones.map((s, i) => {
            const n = props.descansos[i] ?? 0
            return (
              <li key={s.value}>
                <span>Tras {s.label}</span>
                <span class={styles.counter}>
                  <button
                    type="button"
                    aria-label={`Descansos tras ${s.label}: menos`}
                    disabled={n <= 0}
                    onClick={() => ponDescansos(i, n - 1)}
                  >
                    <MinusIcon />
                  </button>
                  <b aria-label={`Descansos tras ${s.label}`}>{n}</b>
                  <button
                    type="button"
                    aria-label={`Descansos tras ${s.label}: más`}
                    disabled={n >= MAX_DESCANSOS}
                    onClick={() => ponDescansos(i, n + 1)}
                  >
                    <PlusIcon />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
        {props.descansosCambiados && (
          <button type="button" class={styles.restore} onClick={props.onDescansosRutina}>
            Volver a los de la rutina
          </button>
        )}
      </Desplegable>
      <button type="button" class={styles.photoRow} onClick={props.onFoto}>
        <span>Foto de la sesión</span>
        <span class={styles.photoValue}>
          {props.tieneFoto ? 'Cambiar' : 'Añadir'}
          <ChevronRightIcon />
        </span>
      </button>
      {props.consejo && <ConsejoEntrenador consejo={props.consejo} onVale={props.onVale} />}
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
