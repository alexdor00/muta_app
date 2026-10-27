import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { familySummary, groupByFamily, routines, type CatalogEntry } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const LEVEL_LABEL = { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' } as const
type Section = 'para-ti' | 'cinco-dias' | 'otras'

/**
 * Elige tu rutina: una tarjeta por tipo de entrenamiento (familia).
 * - Recomendadas: familias con alguna rutina de tus días y tu nivel.
 * - Principiante que pidió más de 4 días: además, las familias con rutinas de 5.
 * - El resto, detrás de «Ver rutinas de otros días».
 * Al tocar una familia se ven sus versiones; si solo tiene una, se elige directamente.
 */
export function ElegirRutinaScreen() {
  const { route } = useLocation()
  const [showOthers, setShowOthers] = useState(false)
  useEffect(() => void loadRoutines(), [])
  const state = routines.value

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

  const ready = state
  const intro = ready.profile
    ? `Para ${ready.profile.daysPerWeek} días por semana · nivel ${LEVEL_LABEL[ready.profile.level]}`
    : undefined

  async function open(section: Section, entries: CatalogEntry[]) {
    if (entries.length > 1) {
      route(paths.routineFamily(entries[0].family, section))
      return
    }
    try {
      const [entry] = entries
      await chooseRoutine(entry.id, ready.adjusted.has(entry.id) ? 'beginner' : null)
      route(paths.training)
    } catch (error) {
      logError(error, 'elegir rutina')
    }
  }

  const familyCards = (section: Section, entries: CatalogEntry[]) => (
    <div class={styles.list}>
      {groupByFamily(entries).map(({ family, entries: group }) => (
        <PhotoCard
          key={family.id}
          title={family.title}
          subtitle={familySummary(group)}
          tone={family.tone}
          badge={group.some((e) => e.id === ready.currentId) ? 'Tu rutina' : undefined}
          onClick={() => void open(section, group)}
        />
      ))}
    </div>
  )

  return (
    <div class={styles.page}>
      <ScreenHeader title="Elige tu rutina" intro={intro} avatarHref={paths.profile} />
      {ready.notice && (
        <p class={styles.notice} role="note">
          {ready.notice}
        </p>
      )}

      <section class={styles.section} aria-label="Recomendadas para ti">
        <h2 class={styles.sectionTitle}>Recomendadas para ti</h2>
        {familyCards('para-ti', ready.recommended)}
      </section>

      {ready.alsoAllowed.length > 0 && (
        <section class={styles.section} aria-label="Hasta 5 días">
          <h2 class={styles.sectionTitle}>Si prefieres 5 días</h2>
          {familyCards('cinco-dias', ready.alsoAllowed)}
        </section>
      )}

      {ready.others.length > 0 && (
        <section class={styles.section} aria-label="Otras rutinas">
          {showOthers ? (
            <>
              <h2 class={styles.sectionTitle}>Rutinas de otros días</h2>
              {familyCards('otras', ready.others)}
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
