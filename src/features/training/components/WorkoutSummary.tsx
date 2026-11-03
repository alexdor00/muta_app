import { Button } from '../../../shared/ui/Button.tsx'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CloseIcon,
  FlameIcon,
  PlusIcon,
  ShareIcon,
} from '../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../shared/ui/RoundButton.tsx'
import styles from './WorkoutSummary.module.css'

type Props = {
  sigla: string
  /** «Isquios, glúteo y pecho · mar 27 oct». */
  subtitulo: string
  /** Días seguidos de racha (el fuego): los entrenados y los de descanso del plan. */
  racha: number
  /** «2 de 4 esta semana». */
  semanaTexto: string
  /** Lunes a domingo: letra, si ese día se entrenó y si es hoy. */
  semana: { letra: string; hecho: boolean; hoy: boolean }[]
  /** Cuatro cifras: valor grande, unidad pequeña y qué es. */
  cifras: { valor: string; unidad: string; nombre: string }[]
  /** «3 de 4 suben». */
  suben: string
  ejercicios: {
    nombre: string
    series: { texto: string; mejor: boolean }[]
    /** Frente a la vez anterior: subió el peso, más reps, bajó o igual (null sin vez anterior). */
    cambio: { texto: string; tipo: 'kg' | 'reps' | 'baja' | 'igual' } | null
  }[]
  onHecho: () => void
  onCompartir: () => void
  onVolver: () => void
}

/**
 * Resumen de la sesión terminada (C24 del prototipo anterior): la racha con su fuego y la semana, cuatro cifras y cada
 * ejercicio frente a la última vez, con ★ en las series que mejoran. «Hecho», «Compartir» y volver a la sesión.
 */
export function WorkoutSummary(props: Props) {
  return (
    <div class={styles.page}>
      <div class={styles.close}>
        <RoundButton label="Cerrar" variant="plain" onClick={props.onHecho}>
          <CloseIcon />
        </RoundButton>
      </div>
      <header class={styles.head}>
        <h1>
          <span class={styles.sigla}>{props.sigla}</span>
          <span class={styles.hidden}> completada</span>
        </h1>
        <p class={styles.sub}>{props.subtitulo}</p>
      </header>

      <section class={styles.week} aria-label="Tu racha">
        <p class={styles.weekText}>
          <span class={styles.flame}>
            <FlameIcon />
          </span>
          <b>{props.racha}</b> {props.racha === 1 ? 'día' : 'días'} de racha · {props.semanaTexto}
        </p>
        <ol class={styles.days}>
          {props.semana.map((d, i) => (
            <li key={i} class={d.hoy ? styles.today : ''}>
              <span class={`${styles.day} ${d.hecho ? styles.dayDone : ''}`}>{d.hecho && <CheckIcon />}</span>
              <span class={styles.letter}>{d.letra}</span>
            </li>
          ))}
        </ol>
      </section>

      <ul class={styles.tiles}>
        {props.cifras.map((c) => (
          <li key={c.nombre} class={styles.tile}>
            <span class={styles.value}>
              <b>{c.valor}</b>
              {c.unidad && <small>{c.unidad}</small>}
            </span>
            <span class={styles.tileName}>{c.nombre}</span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="frente">
        <div class={styles.listHead}>
          <h2 id="frente">Frente a la última vez</h2>
          <span>{props.suben}</span>
        </div>
        <ul class={styles.list}>
          {props.ejercicios.map((e) => (
            <li key={e.nombre} class={styles.row}>
              <div class={styles.rowText}>
                <p class={styles.name}>{e.nombre}</p>
                <p class={styles.sets}>
                  {e.series.map((s, j) => (
                    <span key={j} class={s.mejor ? styles.better : ''}>
                      {s.mejor && '★ '}
                      {s.texto}
                    </span>
                  ))}
                </p>
              </div>
              {e.cambio && (
                <span class={`${styles.change} ${styles[e.cambio.tipo]}`}>
                  <span class={styles.sign}>
                    {e.cambio.tipo === 'kg' && <ArrowUpIcon />}
                    {e.cambio.tipo === 'reps' && <PlusIcon />}
                    {e.cambio.tipo === 'baja' && <ArrowDownIcon />}
                    {e.cambio.tipo === 'igual' && '='}
                  </span>
                  {e.cambio.texto}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div class={styles.actions}>
        <Button onClick={props.onHecho}>Hecho</Button>
        <Button variant="secondary" onClick={props.onCompartir}>
          <span class={styles.share}>
            <ShareIcon />
            Compartir
          </span>
        </Button>
        <button type="button" class={styles.back} onClick={props.onVolver}>
          Me faltó un ejercicio: volver a la sesión
        </button>
      </div>
    </div>
  )
}
