import { Button } from '../../../shared/ui/Button.tsx'
import styles from './FinDeRutinaCard.module.css'

type Props = {
  /** «Has completado Torso-pierna» (resumen) o «Terminaste tu rutina» (Tu plan). */
  titulo: string
  texto: string
  /** Las cifras de la rutina entera (en el resumen): la mejora en verde, los récords en naranja (son logro). */
  cifras?: { valor: string; nombre: string; tono?: 'mejora' | 'logro' }[]
  onRepetir: () => void
  hrefCambiar: string
  onAhoraNo: () => void
}

/**
 * Terminaste tu rutina (usuario, 2026-11-23; `Desktop/MUTA-Fin-de-rutina-propuesta.png`): la misma tarjeta en el resumen de
 * la última sesión y en Tu plan. «Repetirla» empieza otra etapa con ella; nada cambia hasta que eliges.
 */
export function FinDeRutinaCard({ titulo, texto, cifras, onRepetir, hrefCambiar, onAhoraNo }: Props) {
  return (
    <section class={styles.card} aria-label="Rutina terminada">
      <span class={styles.pill}>Rutina terminada</span>
      <h2 class={styles.titulo}>{titulo}</h2>
      <p class={styles.texto}>{texto}</p>
      {cifras && cifras.length > 0 && (
        <ul class={styles.cifras}>
          {cifras.map((c) => (
            <li key={c.nombre}>
              <b class={c.tono === 'mejora' ? styles.mejora : c.tono === 'logro' ? styles.logro : ''}>
                {c.valor}
              </b>
              {c.nombre}
            </li>
          ))}
        </ul>
      )}
      <div class={styles.botones}>
        <Button onClick={onRepetir}>Repetirla</Button>
        <Button variant="secondary" href={hrefCambiar}>
          Cambiar de rutina
        </Button>
        <button type="button" class={styles.ahoraNo} onClick={onAhoraNo}>
          Ahora no
        </button>
      </div>
    </section>
  )
}
