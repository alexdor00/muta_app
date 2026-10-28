import styles from './RoutineAbout.module.css'

type Props = {
  about: { summary: string; forWho: string; how: string[]; basics?: string; note?: string }
}

/** «De qué trata» una rutina (contenido de la hoja de la «!»). */
export function RoutineAbout({ about }: Props) {
  return (
    <div class={styles.about}>
      <p class={styles.summary}>{about.summary}</p>
      {about.basics && (
        <p class={styles.basics}>
          <b>Mejora los básicos.</b> {about.basics}
        </p>
      )}
      <h3 class={styles.h3}>Para quién</h3>
      <p class={styles.text}>{about.forWho}</p>
      <h3 class={styles.h3}>Cómo funciona</h3>
      <ul class={styles.list}>
        {about.how.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {about.note && <p class={styles.note}>{about.note}</p>}
    </div>
  )
}
