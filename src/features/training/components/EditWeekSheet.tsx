import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, MoonIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './EditWeekSheet.module.css'

export type SesionSemana = { sigla: string; nombre: string; ejercicios: number }

/**
 * Editar rutina, primera pantalla: tu semana como una lista, en orden. Cada sesión (tocarla abre sus ejercicios) y, detrás,
 * sus días de descanso con «Quitar». «+ Añadir un día de descanso» pregunta después de qué sesión. Volver a la original.
 */
export function EditWeekSheet(props: {
  sesiones: SesionSemana[]
  /** Días de descanso tras cada sesión, en el orden de `sesiones`. */
  descansos: number[]
  onSesion: (sigla: string) => void
  onQuitarDescanso: (i: number) => void
  onAnadirDescanso: () => void
  onVolver: () => void
  onClose: () => void
}) {
  return (
    <Sheet title="Editar rutina" onClose={props.onClose} large>
      <h3 class={styles.eyebrow}>Tu semana, en este orden</h3>
      <ol class={styles.list} aria-label="Tu semana">
        {props.sesiones.map((s, i) => (
          <li key={s.sigla}>
            <button type="button" class={styles.session} onClick={() => props.onSesion(s.sigla)}>
              <span class={styles.number}>{i + 1}</span>
              <span class={styles.name}>{s.nombre}</span>
              <span class={styles.count}>
                {s.ejercicios === 1 ? '1 ejercicio' : `${s.ejercicios} ejercicios`}
              </span>
              <ChevronRightIcon />
            </button>
            {Array.from({ length: props.descansos[i] ?? 0 }, (_, k) => (
              <div key={k} class={styles.rest}>
                <MoonIcon />
                <span class={styles.restName}>Día de descanso</span>
                <button
                  type="button"
                  class={styles.remove}
                  aria-label={`Quitar el día de descanso después de ${s.nombre}`}
                  onClick={() => props.onQuitarDescanso(i)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </li>
        ))}
      </ol>
      <button type="button" class={styles.add} onClick={props.onAnadirDescanso}>
        <PlusIcon />
        Añadir un día de descanso
      </button>
      <button type="button" class={styles.restore} onClick={props.onVolver}>
        Volver a la rutina original
      </button>
    </Sheet>
  )
}

/** «¿Después de qué sesión?»: dónde va el día de descanso nuevo. */
export function RestAfterSheet(props: {
  sesiones: SesionSemana[]
  onElegir: (i: number) => void
  onClose: () => void
}) {
  return (
    <Sheet title="¿Después de qué sesión?" onClose={props.onClose} large>
      <p class={styles.lead}>El día de descanso va justo después de la sesión que elijas.</p>
      <ChoiceList
        name="descanso-tras"
        legend="Después de qué sesión"
        options={props.sesiones.map((s, i) => ({ value: String(i), label: `${i + 1}. ${s.nombre}` }))}
        value=""
        onChange={(v) => props.onElegir(Number(v))}
      />
    </Sheet>
  )
}
