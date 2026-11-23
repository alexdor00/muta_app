import type { ComponentChildren } from 'preact'
import { Deslizable } from '../../../shared/ui/Deslizable.tsx'
import { GripIcon } from '../../../shared/ui/icons.tsx'
import { useReordenar } from '../../../shared/ui/useReordenar.ts'
import styles from './EditList.module.css'

/** Una fila de una lista de Editar rutina (una sesión, un día de descanso o un ejercicio). */
export type FilaLista = {
  key: string
  /** El círculo de la izquierda: su número o un icono. */
  insignia: ComponentChildren
  titulo: string
  detalle?: string | null
  /** Una línea más, en pequeño («En lugar de …», «Añadido por ti»). */
  nota?: string | null
  /** Desde «Tu entrenador»: lo que entrena ese músculo, resaltado con su texto. */
  marca?: string | null
  /** Más suave (un día de descanso). */
  tenue?: boolean
  /** En superserie con la de al lado: la primera, una de en medio o la última (las une una raya). */
  unida?: 'inicio' | 'medio' | 'fin' | null
  /** Tocar la fila (sin esto, no se toca). */
  onAbrir?: () => void
  /** Deslizar a la izquierda descubre «Quitar» (sin esto, no se desliza). */
  quitar?: { ariaLabel: string; onQuitar: () => void } | null
}

/**
 * Las listas de Editar rutina, todas iguales (tu semana y los ejercicios de una sesión): una tarjeta blanca con una fila
 * por cosa, el círculo a la izquierda, su asa (≡) a la derecha para moverla, deslizar a la izquierda para quitarla y, al
 * final, la fila para añadir (`pie`).
 */
export function EditList(props: {
  etiqueta: string
  filas: FilaLista[]
  onMover: (de: number, a: number) => void
  pie?: ComponentChildren
}) {
  const { listaRef, orden, levantada, asa } = useReordenar(props.filas.length, props.onMover)
  return (
    <div class={styles.card}>
      <ol ref={listaRef} class={styles.lista} aria-label={props.etiqueta}>
        {orden.map((i) => {
          const f = props.filas[i]
          const contenido = (
            <div class={`${styles.fila} ${f.marca ? styles.marcada : ''}`}>
              <span
                class={`${styles.insignia} ${f.tenue ? styles.insigniaTenue : ''} ${f.unida ? styles[f.unida] : ''}`}
                aria-hidden="true"
              >
                {f.insignia}
              </span>
              {f.onAbrir ? (
                <button type="button" class={styles.texto} onClick={f.onAbrir}>
                  <Texto f={f} />
                </button>
              ) : (
                <span class={styles.texto}>
                  <Texto f={f} />
                </span>
              )}
              <button type="button" class={styles.asa} aria-label={`Mover ${f.titulo}`} {...asa(i)}>
                <GripIcon />
              </button>
            </div>
          )
          return (
            <li key={f.key} class={levantada === i ? styles.levantada : ''}>
              {f.quitar ? (
                <Deslizable ariaLabel={f.quitar.ariaLabel} onQuitar={f.quitar.onQuitar} fondo="surface" plano>
                  {contenido}
                </Deslizable>
              ) : (
                contenido
              )}
            </li>
          )
        })}
      </ol>
      {props.pie}
    </div>
  )
}

function Texto({ f }: { f: FilaLista }) {
  return (
    <>
      {f.unida === 'inicio' && <span class={styles.etiqueta}>Superserie</span>}
      <span class={`${styles.titulo} ${f.tenue ? styles.tituloTenue : ''}`}>{f.titulo}</span>
      {f.detalle && <span class={styles.detalle}>{f.detalle}</span>}
      {f.nota && <span class={styles.nota}>{f.nota}</span>}
      {f.marca && <small class={styles.marca}>{f.marca}</small>}
    </>
  )
}

/** La última fila de una lista: «+ Añadir ejercicio» (o lo que sea), con su círculo como las demás. */
export function FilaAnadir(props: { texto: string; icono: ComponentChildren; onClick: () => void }) {
  return (
    <button type="button" class={styles.anadir} onClick={props.onClick}>
      <span class={`${styles.insignia} ${styles.insigniaTenue}`} aria-hidden="true">
        {props.icono}
      </span>
      {props.texto}
    </button>
  )
}
