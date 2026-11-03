import type { ComponentChildren } from 'preact'
import { ChevronDownIcon } from '../../../shared/ui/icons.tsx'
import styles from './Desplegable.module.css'

/**
 * Una fila que se despliega (Editar rutina): el título a la izquierda y lo elegido en gris a la derecha. `abierto` y
 * `onAbrir` la controlan desde fuera (para cerrarla al elegir).
 */
export function Desplegable(props: {
  titulo: string
  valor: string
  abierto: boolean
  onAbrir: (abierto: boolean) => void
  children: ComponentChildren
}) {
  return (
    <details
      class={styles.more}
      open={props.abierto}
      onToggle={(e) => props.onAbrir((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span>{props.titulo}</span>
        <span class={styles.value}>
          {props.valor}
          <ChevronDownIcon />
        </span>
      </summary>
      <div class={styles.body}>{props.children}</div>
    </details>
  )
}
