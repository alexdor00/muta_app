import type { ComponentChildren } from 'preact'
import { CloseIcon } from '../../../../shared/ui/icons.tsx'
import styles from './AvisoDia.module.css'

/**
 * Un aviso del día debajo de la tarjeta (usuario, 2026-11-17): «Aún no tienes menú» o «Hoy llevas … kcal de
 * más». Título, una frase y sus botones; nada en rojo.
 */
export function AvisoDia(props: {
  titulo: string
  texto: string
  children?: ComponentChildren
  /** «×»: quitarlo para siempre (usuario, 2026-11-19: «si no quieres seguir un menú, que no vuelva a salir»). */
  onQuitar?: () => void
}) {
  return (
    <section class={styles.aviso} aria-label={props.titulo}>
      <div class={styles.cabeza}>
        <h2 class={styles.titulo}>{props.titulo}</h2>
        {props.onQuitar && (
          <button
            type="button"
            class={styles.quitar}
            aria-label="No volver a enseñar este aviso"
            onClick={props.onQuitar}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <p class={styles.texto}>{props.texto}</p>
      {props.children && <div class={styles.botones}>{props.children}</div>}
    </section>
  )
}
