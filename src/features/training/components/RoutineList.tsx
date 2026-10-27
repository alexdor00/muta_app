import { PhotoCard } from '../../../shared/ui/PhotoCard.tsx'
import styles from './RoutineList.module.css'

type Routine = { id: string; title: string; subtitle: string; tone: 1 | 2 | 3 | 4 | 5 | 6 }

type Props = {
  entries: Routine[]
  adjusted: ReadonlySet<string>
  currentId: string | null
  onChoose: (id: string) => void
}

/** Tarjetas de rutinas concretas, con «Tu rutina» o «Ajustada a tu nivel». Solo pinta. */
export function RoutineList({ entries, adjusted, currentId, onChoose }: Props) {
  return (
    <div class={styles.list}>
      {entries.map((entry) => (
        <PhotoCard
          key={entry.id}
          title={entry.title}
          subtitle={entry.subtitle}
          tone={entry.tone}
          badge={
            entry.id === currentId ? 'Tu rutina' : adjusted.has(entry.id) ? 'Ajustada a tu nivel' : undefined
          }
          onClick={() => onChoose(entry.id)}
        />
      ))}
    </div>
  )
}
