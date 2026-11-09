import { Fragment } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { ChevronDownIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import styles from './WorkoutKeypad.module.css'

export type Tecla =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'coma' | 'borrar' | 'menos' | 'mas' | 'fallo'

type Props = {
  /** «Peso muerto rumano». */
  titulo: string
  /** «Serie 1 · peso en kg». */
  detalle: string
  /** Con el descanso en marcha, va arriba del teclado en lugar del título (C05). */
  descanso: { tiempo: string; quedan: number; onSaltar: () => void } | null
  /** «+ / −» suman o restan esto («2,5»). */
  paso: string
  /** En la casilla del RIR, la tecla de la coma es «Fallo». */
  rir?: boolean
  onTecla: (tecla: Tecla) => void
  onSiguiente: () => void
  onCerrar: () => void
}

const NUMEROS: Tecla[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

function BorrarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    >
      <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z" />
      <path d="m13 9 5 5m0-5-5 5" stroke-linecap="round" />
    </svg>
  )
}

/**
 * Teclado numérico de la sesión (C02): números, coma, borrar, − / + con el salto de peso, ⌄ para ocultarlo y › para
 * pasar a la casilla siguiente. Se cierra también arrastrándolo hacia abajo.
 */
export function WorkoutKeypad({
  titulo,
  detalle,
  descanso,
  paso,
  rir,
  onTecla,
  onSiguiente,
  onCerrar,
}: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const cerrarRef = useRef(onCerrar)
  useEffect(() => {
    cerrarRef.current = onCerrar
  })
  // Arrastrarlo hacia abajo lo cierra (los escuchadores se ponen una vez: la pantalla se repinta con el reloj)
  useEffect(() => {
    const el = panel.current
    if (!el) return
    let arrastre: { y: number; dy: number } | null = null
    const down = (e: PointerEvent) => {
      arrastre = { y: e.clientY, dy: 0 }
    }
    const move = (e: PointerEvent) => {
      if (!arrastre) return
      arrastre.dy = Math.max(0, e.clientY - arrastre.y)
      el.style.transform = `translate(-50%, ${arrastre.dy}px)`
    }
    const up = () => {
      const dy = arrastre?.dy ?? 0
      arrastre = null
      el.style.transform = ''
      if (dy > 60) cerrarRef.current()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [])
  const tecla = (t: Tecla, contenido: string, label?: string) => (
    <button
      type="button"
      class={styles.key}
      aria-label={label}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => onTecla(t)}
    >
      {contenido}
    </button>
  )
  return (
    <div ref={panel} class={styles.pad} role="group" aria-label="Teclado numérico">
      <span class={styles.grip} aria-hidden="true" />
      {descanso ? (
        <div
          class={`${styles.rest} ${descanso.quedan <= 0 ? styles.over : ''}`}
          role="timer"
          aria-label="Descanso"
        >
          <div class={styles.restText}>
            <b>{descanso.tiempo}</b>
            <small>{descanso.quedan <= 0 ? '¡A por ella!' : 'Descanso entre series'}</small>
          </div>
          <button type="button" class={styles.restSkip} onClick={descanso.onSaltar}>
            Omitir
          </button>
        </div>
      ) : (
        <div class={styles.context}>
          <b>{titulo}</b>
          <small>{detalle}</small>
        </div>
      )}
      <div class={styles.keys}>
        {NUMEROS.map((fila, i) => (
          <Fragment key={i}>
            {fila.map((n) => tecla(n, n))}
            {i === 0 && (
              <button
                type="button"
                class={`${styles.key} ${styles.fn}`}
                aria-label="Borrar"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onTecla('borrar')}
              >
                <BorrarIcon />
              </button>
            )}
            {i === 1 && tecla('menos', '−', `Menos ${paso}`)}
            {i === 2 && tecla('mas', '+', `Más ${paso}`)}
          </Fragment>
        ))}
        {rir
          ? tecla('fallo', 'Fallo', 'Fallo: intentaste otra repetición y no salió')
          : tecla('coma', ',', 'Coma')}
        {tecla('0', '0')}
        <button
          type="button"
          class={`${styles.key} ${styles.fn}`}
          aria-label="Ocultar teclado"
          onPointerDown={(e) => e.preventDefault()}
          onClick={onCerrar}
        >
          <ChevronDownIcon />
        </button>
        <button
          type="button"
          class={`${styles.key} ${styles.go}`}
          aria-label="Siguiente"
          onPointerDown={(e) => e.preventDefault()}
          onClick={onSiguiente}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}
