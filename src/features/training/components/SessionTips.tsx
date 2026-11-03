import { Button } from '../../../shared/ui/Button.tsx'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './SessionTips.module.css'

// «Consejos de hoy» (C10 del prototipo anterior) y dónde se ven: la tarjeta de Ver sesión y el aviso de la sesión.

export type ConsejoVisto = {
  text: string
  why: string
  /** Se arregla con un toque, solo hoy («Invertir hoy»); `hecho` cuando ya se aplicó. */
  accion?: { label: string; hecho: boolean; onClick: () => void } | null
}

/** Los consejos numerados 01, 02… (desde `desde` + 1) con su porqué; con botón si se arreglan con un toque. */
export function TipList({ consejos, desde = 0 }: { consejos: ConsejoVisto[]; desde?: number }) {
  return (
    <ol class={styles.tips}>
      {consejos.map((c, i) => (
        <li key={c.text} class={styles.tip}>
          <span class={styles.number} aria-hidden="true">
            {String(desde + i + 1).padStart(2, '0')}
          </span>
          <div class={styles.tipText}>
            <p class={styles.text}>{c.text}</p>
            <p class={styles.why}>{c.why}</p>
            {c.accion &&
              (c.accion.hecho ? (
                <p class={styles.done}>
                  <CheckIcon />
                  Hecho, solo hoy
                </p>
              ) : (
                <button type="button" class={styles.fix} onClick={c.accion.onClick}>
                  {c.accion.label}
                </button>
              ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Ver sesión: «Consejos para esta sesión · 3», plegados para que no ocupen (si no hay ninguno, no sale). */
export function SessionTipsCard({ consejos }: { consejos: ConsejoVisto[] }) {
  if (!consejos.length) return null
  return (
    <details class={styles.card}>
      <summary class={styles.summary}>
        <span>
          Consejos para esta sesión <span class={styles.count}>· {consejos.length}</span>
        </span>
        <ChevronDownIcon />
      </summary>
      <TipList consejos={consejos} />
    </details>
  )
}

/** En la sesión, encima del primer ejercicio: «2 consejos para esta sesión ›». */
export function TipsBanner({ cuantos, onAbrir }: { cuantos: number; onAbrir: () => void }) {
  return (
    <button type="button" class={styles.banner} onClick={onAbrir}>
      <span>
        {cuantos} {cuantos === 1 ? 'consejo' : 'consejos'} para esta sesión
      </span>
      <ChevronRightIcon />
    </button>
  )
}

/** La hoja «Consejos de hoy» (C10): la sesión, lo de hoy, «Antes de la primera serie» con casillas, Listo y la preferencia. */
export function TodayTipsSheet(props: {
  sigla: string
  nombre: string
  detalle: string
  consejos: ConsejoVisto[]
  antes: { text: string; why: string; hecho: boolean }[]
  onMarcar: (k: number) => void
  alEmpezar: boolean
  onAlEmpezar: () => void
  onClose: () => void
}) {
  const hechos = props.antes.filter((a) => a.hecho).length
  return (
    <Sheet
      title="Consejos de hoy"
      onClose={props.onClose}
      large
      footer={
        <div class={styles.footer}>
          <Button onClick={props.onClose}>Listo</Button>
          <button
            type="button"
            class={styles.link}
            aria-pressed={props.alEmpezar}
            onClick={props.onAlEmpezar}
          >
            {props.alEmpezar ? 'No mostrar al empezar' : 'Mostrar al empezar'}
          </button>
        </div>
      }
    >
      <div class={styles.session}>
        <span class={styles.sigla}>{props.sigla}</span>
        <span class={styles.sessionText}>
          <b>{props.nombre}</b>
          <small>{props.detalle}</small>
        </span>
      </div>
      {props.consejos.length > 0 && (
        <section aria-labelledby="para-esta-sesion">
          <h3 id="para-esta-sesion" class={styles.label}>
            Para esta sesión
          </h3>
          <TipList consejos={props.consejos} />
        </section>
      )}
      <section aria-labelledby="antes-primera">
        <div class={styles.labelRow}>
          <h3 id="antes-primera" class={styles.label}>
            Antes de la primera serie
          </h3>
          <span class={styles.count}>
            {hechos} de {props.antes.length}
          </span>
        </div>
        <ul class={styles.checks}>
          {props.antes.map((a, k) => (
            <li key={a.text}>
              <button
                type="button"
                class={`${styles.check} ${a.hecho ? styles.on : ''}`}
                aria-pressed={a.hecho}
                onClick={() => props.onMarcar(k)}
              >
                <span class={styles.circle} aria-hidden="true">
                  {a.hecho && <CheckIcon />}
                </span>
                <span class={styles.checkText}>
                  <b>{a.text}</b>
                  <small>{a.why}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Sheet>
  )
}
