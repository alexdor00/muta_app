import type { JSX } from 'preact'
import { ChevronRightIcon } from './icons.tsx'
import styles from './MenuList.module.css'

/** Una fila: abre otra pantalla (`href`) o hace algo (`onClick`). */
export type MenuRow = {
  label: string
  /** Una línea gris debajo («hoy 18:00 · 8 cosas»). */
  detail?: string
  Icon: () => JSX.Element
} & ({ href: string } | { onClick: () => void })

/** Las filas de un «···» (Tu rutina en Entreno, Nutrición): icono, nombre, su detalle en gris y «›». */
export function MenuList({ rows }: { rows: MenuRow[] }) {
  return (
    <ul class={styles.list}>
      {rows.map((r) => {
        const contenido = (
          <>
            <span class={styles.icon}>
              <r.Icon />
            </span>
            <span class={styles.text}>
              <span class={styles.label}>{r.label}</span>
              {r.detail && <span class={styles.detail}>{r.detail}</span>}
            </span>
            <span class={styles.chevron}>
              <ChevronRightIcon />
            </span>
          </>
        )
        return (
          <li key={r.label}>
            {'href' in r ? (
              <a class={styles.row} href={r.href}>
                {contenido}
              </a>
            ) : (
              <button type="button" class={styles.row} onClick={r.onClick}>
                {contenido}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
