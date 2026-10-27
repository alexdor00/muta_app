import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { routines } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const LEVEL_LABEL = { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' } as const

/** Elige tu rutina: las recomendadas según la bienvenida y, debajo, todas las demás. */
export function ElegirRutinaScreen() {
  const { route } = useLocation()
  useEffect(() => void loadRoutines(), [])
  const state = routines.value

  async function choose(id: string) {
    try {
      await chooseRoutine(id)
      route(paths.training)
    } catch (error) {
      logError(error, 'elegir rutina')
    }
  }

  const intro =
    state.status === 'ready' && state.profile
      ? `Para ${state.profile.daysPerWeek} días por semana · nivel ${LEVEL_LABEL[state.profile.level]}`
      : undefined

  return (
    <div class={styles.page}>
      <ScreenHeader title="Elige tu rutina" intro={intro} avatarHref={paths.profile} />
      {state.status === 'loading' && <p class={styles.message}>Cargando…</p>}
      {state.status === 'error' && <p class={styles.message}>No se han podido cargar las rutinas.</p>}
      {state.status === 'ready' &&
        [
          { title: 'Recomendadas para ti', list: state.recommended },
          { title: 'Otras rutinas', list: state.others },
        ]
          .filter((section) => section.list.length)
          .map((section) => (
            <section key={section.title} class={styles.section} aria-label={section.title}>
              <h2 class={styles.sectionTitle}>{section.title}</h2>
              <div class={styles.list}>
                {section.list.map((entry) => (
                  <PhotoCard
                    key={entry.id}
                    title={entry.title}
                    subtitle={entry.subtitle}
                    tone={entry.tone}
                    badge={entry.id === state.currentId ? 'Tu rutina' : undefined}
                    onClick={() => void choose(entry.id)}
                  />
                ))}
              </div>
            </section>
          ))}
    </div>
  )
}
