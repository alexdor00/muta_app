import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { routines, type CatalogEntry } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const LEVEL_LABEL = { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' } as const

/**
 * Elige tu rutina: las recomendadas según la bienvenida; para un principiante que pidió
 * más de 4 días, también las de 5; el resto, escondido detrás de «Ver rutinas de otros días».
 */
export function ElegirRutinaScreen() {
  const { route } = useLocation()
  const [showOthers, setShowOthers] = useState(false)
  useEffect(() => void loadRoutines(), [])
  const state = routines.value

  async function choose(id: string, adjusted: boolean) {
    try {
      await chooseRoutine(id, adjusted ? 'beginner' : null)
      route(paths.training)
    } catch (error) {
      logError(error, 'elegir rutina')
    }
  }

  if (state.status !== 'ready') {
    return (
      <div class={styles.page}>
        <ScreenHeader title="Elige tu rutina" avatarHref={paths.profile} />
        <p class={styles.message}>
          {state.status === 'loading' ? 'Cargando…' : 'No se han podido cargar las rutinas.'}
        </p>
      </div>
    )
  }

  const intro = state.profile
    ? `Para ${state.profile.daysPerWeek} días por semana · nivel ${LEVEL_LABEL[state.profile.level]}`
    : undefined

  const cards = (list: CatalogEntry[]) => (
    <div class={styles.list}>
      {list.map((entry) => {
        const adjusted = state.adjusted.has(entry.id)
        const badge =
          entry.id === state.currentId ? 'Tu rutina' : adjusted ? 'Ajustada a tu nivel' : undefined
        return (
          <PhotoCard
            key={entry.id}
            title={entry.title}
            subtitle={entry.subtitle}
            tone={entry.tone}
            badge={badge}
            onClick={() => void choose(entry.id, adjusted)}
          />
        )
      })}
    </div>
  )

  return (
    <div class={styles.page}>
      <ScreenHeader title="Elige tu rutina" intro={intro} avatarHref={paths.profile} />
      {state.notice && (
        <p class={styles.notice} role="note">
          {state.notice}
        </p>
      )}

      <section class={styles.section} aria-label="Recomendadas para ti">
        <h2 class={styles.sectionTitle}>Recomendadas para ti</h2>
        {cards(state.recommended)}
      </section>

      {state.alsoAllowed.length > 0 && (
        <section class={styles.section} aria-label="Hasta 5 días">
          <h2 class={styles.sectionTitle}>Si prefieres 5 días</h2>
          {cards(state.alsoAllowed)}
        </section>
      )}

      {state.others.length > 0 && (
        <section class={styles.section} aria-label="Otras rutinas">
          {showOthers ? (
            <>
              <h2 class={styles.sectionTitle}>Rutinas de otros días</h2>
              {cards(state.others)}
            </>
          ) : (
            <div class={styles.more}>
              <Button variant="secondary" onClick={() => setShowOthers(true)}>
                Ver rutinas de otros días
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
