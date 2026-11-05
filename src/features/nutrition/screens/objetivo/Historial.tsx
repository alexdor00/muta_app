import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { CheckIcon, CloseIcon } from '../../../../shared/ui/icons.tsx'
import type { Cambio } from '../../state/comida.ts'
import styles from './Objetivo.module.css'

type Props = { cambios: Cambio[]; deshacible: string | null; onDeshacer: (id: string) => void }

function titulo(c: Cambio): string {
  const diferencia = c.de === null ? null : c.a - c.de
  const cifra =
    diferencia === null ? '' : `${diferencia > 0 ? '+' : '−'}${formatInt(Math.abs(diferencia))} kcal`
  if (c.tipo === 'sugerencia') {
    const estado = {
      pendiente: 'esperando',
      aplicado: 'aplicado',
      descartado: '«Ahora no»',
      deshecho: 'deshecho',
      hecho: '',
    }[c.status]
    return `${cifra} · ${estado}`
  }
  if (c.tipo === 'sin-cambios') return 'Sin cambios'
  return diferencia ? `${c.texto} · ${cifra}` : c.texto
}

function detalle(c: Cambio): string {
  const fecha = formatDayDate(c.fecha)
  if (c.tipo === 'sugerencia') return `${fecha} · ${c.texto.toLowerCase()}`
  if (c.tipo === 'sin-cambios') return `${fecha} · ${c.texto.toLowerCase()}`
  return `${fecha} · ${formatInt(c.a)} kcal`
}

/** Lo que ha cambiado tu objetivo y por qué, lo más nuevo arriba; el último cambio aceptado se puede deshacer. */
export function Historial({ cambios, deshacible, onDeshacer }: Props) {
  if (!cambios.length) return null
  return (
    <section aria-labelledby="historial">
      <h2 id="historial" class={styles.title}>
        Historial
      </h2>
      <ul class={styles.list}>
        {cambios.map((c) => (
          <li key={c.id} class={styles.row}>
            <span
              class={`${styles.mark} ${c.status === 'aplicado' ? styles.markOn : c.status === 'descartado' || c.status === 'deshecho' ? styles.markOff : ''}`}
              aria-hidden="true"
            >
              {c.status === 'aplicado' ? (
                <CheckIcon />
              ) : c.status === 'descartado' || c.status === 'deshecho' ? (
                <CloseIcon />
              ) : (
                '–'
              )}
            </span>
            <span class={styles.rowText}>
              <span class={styles.strong}>{titulo(c)}</span>
              <span class={styles.foot}>{detalle(c)}</span>
            </span>
            {c.id === deshacible && (
              <button type="button" class={styles.undo} onClick={() => onDeshacer(c.id)}>
                Deshacer
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
