import { Button } from '../../../shared/ui/Button.tsx'
import { CheckIcon, ChevronDownIcon, BookIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { TIP_TARJETA, TipList, type ConsejoVisto } from '../../../shared/ui/Consejos.tsx'
import styles from './SessionTips.module.css'

// «Consejos de hoy» (C10 del prototipo anterior) y dónde se ven: la tarjeta de Ver sesión y el aviso de la sesión.

/** Ver sesión: «Consejos para esta sesión · 3», plegados para que no ocupen (si no hay ninguno, no sale). */
export function SessionTipsCard({ consejos }: { consejos: ConsejoVisto[] }) {
  if (!consejos.length) return null
  return (
    <details class={TIP_TARJETA.card}>
      <summary class={TIP_TARJETA.summary}>
        <span>
          Consejos para esta sesión <span class={TIP_TARJETA.count}>· {consejos.length}</span>
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
      <span class={styles.bannerIcon} aria-hidden="true">
        <BookIcon />
      </span>
      <span class={styles.bannerText}>
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
  /** Cuántos ocultaste antes (ya no se ocultan: usuario, 2026-11-12) y volver a enseñarlos. */
  ocultos: number
  onMostrarOcultos: () => void
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
          <span class={TIP_TARJETA.count}>
            {hechos} de {props.antes.length}
          </span>
        </div>
        <ul class={styles.checks}>
          {props.antes.map((a, k) => (
            <li key={a.text} class={styles.checkRow}>
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
        {props.ocultos > 0 && (
          <button type="button" class={styles.showHidden} onClick={props.onMostrarOcultos}>
            {props.ocultos === 1 ? '1 oculto' : `${props.ocultos} ocultos`} · Volver a enseñar
          </button>
        )}
      </section>
    </Sheet>
  )
}
