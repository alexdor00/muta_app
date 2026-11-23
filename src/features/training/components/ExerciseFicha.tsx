import type { JSX } from 'preact'
import { BoltIcon, InfoIcon, PencilIcon } from '../../../shared/ui/icons.tsx'
import { TrophyIcon } from '../../../shared/ui/iconosHoy.tsx'
import { MuscleFigure } from './MuscleFigure.tsx'
import styles from './ExerciseFicha.module.css'

// Las tarjetas de la ficha de un ejercicio (diseño aprobado del 2026-11-02, sin foto). Reciben los textos ya hechos.

/** Cada dato de la pauta: series, repeticiones o descanso. */
type DatoPauta = 'series' | 'reps' | 'descanso'

/** Lo que va debajo de cada cifra de la pauta. */
const QUE: Record<DatoPauta, string> = { series: 'series', reps: 'repeticiones', descanso: 'descanso' }

/** Nombre, músculos principales y la pauta en tres datos (cifra y qué es), sin tarjeta ni nota. */
export function FichaCabecera(props: {
  nombre: string
  musculos: string[]
  pauta: { icono: DatoPauta; texto: string; etiqueta: string }[]
  /** De dónde sale la pauta («Repeticiones de tu rutina»), en gris debajo. */
  nota?: string
}) {
  return (
    // Sin tarjeta: el nombre y, debajo, en una línea de texto, sus músculos y la pauta (usuario, 2026-11-14)
    <header class={styles.head}>
      <h2 class={styles.name}>{props.nombre}</h2>
      {/* La pauta en tres datos: la cifra grande y, debajo, qué es */}
      {props.pauta.length > 0 && (
        <ul class={styles.datos} aria-label="Pauta">
          {props.pauta.map(({ icono, texto, etiqueta }) => (
            <li key={icono} aria-label={etiqueta}>
              <b aria-hidden="true">{texto.replace(/s*(series|serie|reps)$/, '')}</b>
              <span aria-hidden="true">{QUE[icono]}</span>
            </li>
          ))}
        </ul>
      )}
    </header>
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
 * de su documento (o de una web, si el documento no la trae) y de qué rutinas sale.
 */
export function FichaClave(props: { texto: string; fuente?: string | null; web?: string | null }) {
  const { texto, fuente, web } = props
  return (
    <Fila icono={<InfoIcon />} titulo={fuente ? 'Cómo hacerlo' : 'La clave'}>
      <>
        <p class={styles.text}>{texto}</p>
        {fuente && (
          <p class={styles.source}>
            {web ? `Explicación de ${web} · sale en: ${fuente}` : `Del documento de: ${fuente}`}
          </p>
        )}
      </>
    </Fila>
  )
}

/** «Tus notas» del ejercicio: las tuyas (se escriben aquí o en la sesión) y el botón para escribirlas o cambiarlas. */
export function FichaNotas(props: { texto: string; onEscribir: () => void }) {
  return (
    <Fila icono={<PencilIcon />} titulo="Tus notas">
      <>
        <p class={props.texto ? styles.myNote : styles.text}>
          {props.texto || 'Aún no tienes notas de este ejercicio: agujero, agarre, sensaciones…'}
        </p>
        <button type="button" class={styles.write} onClick={props.onEscribir}>
          {props.texto ? 'Cambiar' : 'Escribir'}
        </button>
      </>
    </Fila>
  )
}

/** Lo que toca hoy con su porqué: «↑ Sube · 62,5 kg × 6–10. Llegaste a 10 reps…». */
export function FichaSugerencia(props: { etiqueta: string; valor: string; porque: string }) {
  return (
    <Fila icono={<BoltIcon />} titulo="Peso sugerido">
      <p class={styles.suggestion}>
        {/* Cuando sube, en verde; si no, en gris */}
        <span class={`${styles.tag} ${props.etiqueta.startsWith('↑') ? styles.sube : ''}`}>
          {props.etiqueta}
        </span>
        <span>{props.valor}</span>
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

/** Tu récord, debajo de la gráfica del 1RM: en negro (es historia; el naranja, solo el día que lo consigues). */
export function FichaRecord(props: { valor: string; fecha: string }) {
  return (
    <p class={styles.record}>
      <TrophyIcon />
      <span>Tu récord</span>
      <b>{props.valor}</b>
      <small>· {props.fecha}</small>
    </p>
  )
}
