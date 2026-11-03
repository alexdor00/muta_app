import type { JSX } from 'preact'
import {
  BoltIcon,
  ChevronDownIcon,
  ClockIcon,
  DumbbellIcon,
  InfoIcon,
  RepeatIcon,
  StopwatchIcon,
} from '../../../shared/ui/icons.tsx'
import { MuscleFigure } from './MuscleFigure.tsx'
import styles from './ExerciseFicha.module.css'

// Las tarjetas de la ficha de un ejercicio (diseño aprobado del 2026-11-02, sin foto). Reciben los textos ya hechos.

const ICONO: Record<'series' | 'reps' | 'descanso', () => JSX.Element> = {
  series: DumbbellIcon,
  reps: RepeatIcon,
  descanso: StopwatchIcon,
}

/** Nombre, músculos principales y la pauta («3 series», «6–10 reps», «2:45»). */
export function FichaCabecera(props: {
  nombre: string
  musculos: string[]
  pauta: { icono: keyof typeof ICONO; texto: string; etiqueta: string }[]
}) {
  return (
    <section class={`${styles.card} ${styles.head}`}>
      <h2 class={styles.name}>{props.nombre}</h2>
      <ul class={styles.chips} aria-label="Músculos principales">
        {props.musculos.map((m) => (
          <li key={m} class={styles.chip}>
            {m}
          </li>
        ))}
      </ul>
      <ul class={styles.pills} aria-label="Pauta">
        {props.pauta.map(({ icono, texto, etiqueta }) => {
          const Icono = ICONO[icono]
          return (
            <li key={icono} class={styles.pill} aria-label={etiqueta}>
              <Icono />
              <span aria-hidden="true">{texto}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Una tarjeta con su icono a la izquierda: título y, debajo, el texto. */
function Fila(props: { icono: JSX.Element; titulo: string; children: JSX.Element | JSX.Element[] }) {
  return (
    <section class={`${styles.card} ${styles.row}`} aria-label={props.titulo}>
      <span class={styles.icon}>{props.icono}</span>
      <div class={styles.rowText}>
        <h3 class={styles.title}>{props.titulo}</h3>
        {props.children}
      </div>
    </section>
  )
}

/**
 * «La clave» de la técnica, de la biblioteca; en un ejercicio original de una rutina, «Cómo hacerlo» con la explicación
 * de su documento y de qué rutinas sale.
 */
export function FichaClave({ texto, fuente }: { texto: string; fuente?: string | null }) {
  return (
    <Fila icono={<InfoIcon />} titulo={fuente ? 'Cómo hacerlo' : 'La clave'}>
      <>
        <p class={styles.text}>{texto}</p>
        {fuente && <p class={styles.source}>Del documento de: {fuente}</p>}
      </>
    </Fila>
  )
}

/** Lo que toca hoy con su porqué: «↑ Sube · 62,5 kg × 6–10. Llegaste a 10 reps…». */
export function FichaSugerencia(props: { etiqueta: string; valor: string; porque: string }) {
  return (
    <Fila icono={<BoltIcon />} titulo="Peso sugerido">
      <p class={styles.suggestion}>
        <span class={styles.tag}>{props.etiqueta}</span>
        <strong>{props.valor}</strong>
      </p>
      <p class={styles.text}>{props.porque}</p>
    </Fila>
  )
}

/** El cuerpo de frente y de espalda con lo que trabaja: en negro los principales y en gris los secundarios. */
export function FichaMusculos(props: {
  principales: { id: string; label: string }[]
  secundarios: { id: string; label: string }[]
  series: Record<string, number>
  names: Record<string, string>
  /** Tocar un músculo abre su ficha (A17). */
  onMusculo: (id: string) => void
}) {
  const lista = (ms: { label: string }[]) => ms.map((m) => m.label).join(', ')
  const dicho = [
    props.principales.length ? `principales: ${lista(props.principales)}` : '',
    props.secundarios.length ? `secundarios: ${lista(props.secundarios)}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  return (
    <section class={`${styles.card} ${styles.muscles}`} aria-label="Músculos que trabaja">
      <div class={styles.figures}>
        <MuscleFigure side="front" series={props.series} names={props.names} label={`De frente: ${dicho}`} />
        <MuscleFigure side="back" series={props.series} names={props.names} label={`De espalda: ${dicho}`} />
      </div>
      <div class={styles.lists}>
        <h3 class={styles.title}>Músculos principales</h3>
        <ul class={styles.chips}>
          {props.principales.map((m) => (
            <li key={m.id}>
              <button type="button" class={styles.chip} onClick={() => props.onMusculo(m.id)}>
                {m.label}
              </button>
            </li>
          ))}
        </ul>
        {props.secundarios.length > 0 && (
          <>
            <h3 class={styles.title}>También trabaja</h3>
            <ul class={styles.chips}>
              {props.secundarios.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    class={`${styles.chip} ${styles.soft}`}
                    onClick={() => props.onMusculo(m.id)}
                  >
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

/** El descanso de este ejercicio en tu plan: el selector abre la lista, y −15 / +15 lo ajustan. */
export function FichaDescanso(props: {
  texto: string
  onElegir: () => void
  onMenos: () => void
  onMas: () => void
}) {
  return (
    <section class={`${styles.card} ${styles.rest}`} aria-label="Descanso">
      <h3 class={styles.restTitle}>
        <ClockIcon />
        Descanso
      </h3>
      <div class={styles.restControls}>
        <button
          type="button"
          class={`${styles.restButton} ${styles.restValue}`}
          aria-label={`Descanso ${props.texto}, elegir otro`}
          onClick={props.onElegir}
        >
          {props.texto}
          <ChevronDownIcon />
        </button>
        <button
          type="button"
          class={styles.restButton}
          aria-label="15 segundos menos"
          onClick={props.onMenos}
        >
          −15
        </button>
        <button type="button" class={styles.restButton} aria-label="15 segundos más" onClick={props.onMas}>
          +15
        </button>
      </div>
    </section>
  )
}
