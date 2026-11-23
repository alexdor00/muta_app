import { useState } from 'preact/hooks'
import { DumbbellIcon, MoonIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { EditList } from './EditList.tsx'
import styles from './EditWeekSheet.module.css'

/** Una fila de tu semana: una sesión (con su número en la semana) o un día de descanso. */
export type FilaTuSemana =
  | {
      tipo: 'sesion'
      sigla: string
      nombre: string
      ejercicios: number
      /** Una que añadiste tú (se puede quitar). */
      propia: boolean
      /** Desde «Tu entrenador»: los ejercicios de esta sesión que entrenan ese músculo (null si ninguno). */
      marca?: string | null
    }
  | { tipo: 'descanso' }

/**
 * Editar rutina, primera pantalla: tu semana en una lista, en orden, con sesiones y días de descanso juntos. Todo se mueve
 * con el asa; deslizar a la izquierda quita un descanso (o una sesión que añadiste). El «+» añade un día de entrenamiento
 * (una sesión vacía al final) o de descanso. Tocar una sesión abre sus ejercicios. Volver a la original, abajo.
 */
export function EditWeekSheet(props: {
  filas: FilaTuSemana[]
  /** Desde «Tu entrenador»: qué músculo y dónde se cambia (null si se abre desde «Tu rutina»). */
  guia?: string | null
  onSesion: (sigla: string) => void
  onMover: (de: number, a: number) => void
  /** Quita la fila `i` (un descanso o una sesión tuya). */
  onQuitar: (i: number) => void
  onAnadirSesion: () => void
  onAnadirDescanso: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const [menu, setMenu] = useState(false)
  // El número de cada sesión en la semana (los descansos no cuentan)
  const numeroDe = (i: number) => props.filas.slice(0, i + 1).filter((f) => f.tipo === 'sesion').length
  // La sesión que va antes de un descanso (para decir cuál se quita)
  const anterior = (i: number) => {
    const s = props.filas.slice(0, i).findLast((f) => f.tipo === 'sesion')
    return s?.tipo === 'sesion' ? s.nombre : 'la última sesión'
  }
  return (
    <Sheet title="Editar rutina" onClose={props.onClose} large alta>
      {props.guia && <p class={styles.guia}>{props.guia}</p>}
      <div class={styles.cabecera}>
        <h3 class={styles.eyebrow}>Tu semana, en este orden</h3>
        <div class={styles.anadir}>
          <button
            type="button"
            class={styles.mas}
            aria-label="Añadir un día"
            aria-expanded={menu}
            aria-haspopup="menu"
            onClick={() => setMenu(!menu)}
          >
            <PlusIcon />
          </button>
          {menu && (
            <>
              <div class={styles.fuera} onClick={() => setMenu(false)} />
              <div class={styles.menu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    props.onAnadirSesion()
                  }}
                >
                  <span class={styles.menuIcono}>
                    <DumbbellIcon />
                  </span>
                  Día de entrenamiento
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    props.onAnadirDescanso()
                  }}
                >
                  <span class={`${styles.menuIcono} ${styles.menuIconoTenue}`}>
                    <MoonIcon />
                  </span>
                  Día de descanso
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <EditList
        etiqueta="Tu semana"
        onMover={props.onMover}
        filas={props.filas.map((f, i) => {
          if (f.tipo === 'descanso')
            return {
              key: `descanso-${i}`,
              insignia: <MoonIcon />,
              titulo: 'Descanso',
              tenue: true,
              quitar: {
                ariaLabel: `Quitar el día de descanso después de ${anterior(i)}`,
                onQuitar: () => props.onQuitar(i),
              },
            }
          return {
            key: f.sigla,
            insignia: numeroDe(i),
            titulo: f.nombre,
            detalle: f.ejercicios
              ? f.ejercicios === 1
                ? '1 ejercicio'
                : `${f.ejercicios} ejercicios`
              : 'Sin ejercicios · tócala para añadir',
            marca: f.marca ?? null,
            onAbrir: () => props.onSesion(f.sigla),
            quitar: f.propia ? { ariaLabel: `Quitar ${f.nombre}`, onQuitar: () => props.onQuitar(i) } : null,
          }
        })}
      />
      <button type="button" class={styles.restore} onClick={props.onVolver}>
        Volver a la rutina original
      </button>
    </Sheet>
  )
}
