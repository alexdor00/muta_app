import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { BookmarkIcon, InfoIcon } from '../../../../shared/ui/icons.tsx'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import { aboutOf, countLabel, routines, type About } from '../../state/routines.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const LEVEL = { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' } as const
const PHASE = { bulk: 'ganar músculo', cut: 'definición', maintenance: 'mantenimiento' } as const

/**
 * Elige tu rutina: la mejor para ti arriba y, debajo, los tipos de entrenamiento.
 * Cada tipo abre su lista (con filtros); cada rutina, su detalle con «Adaptar a mí».
 */
export function ElegirRutinaScreen() {
  const { route } = useLocation()
  useEffect(() => void loadRoutines(), [])
  const state = routines.value
  const infoSheet = useSheet('info')
  /** La «!» abierta: la de un grupo o la de la rutina recomendada. */
  const [info, setInfo] = useState<{ title: string; about: About } | null>(null)
  const infoButton = (title: string, about: About | null) =>
    about && (
      <RoundButton
        label={`De qué trata ${title}`}
        variant="ghost"
        onClick={() => {
          setInfo({ title, about })
          infoSheet.show()
        }}
      >
        <InfoIcon />
      </RoundButton>
    )

  const header = (intro?: string) => (
    <ScreenHeader
      title="Elige tu rutina"
      intro={intro}
      avatarHref={paths.profile}
      action={
        <RoundButton label="Guardadas" variant="plain" href={paths.routineCategory('guardadas')}>
          <BookmarkIcon />
        </RoundButton>
      }
    />
  )

  if (state.status !== 'ready') {
    return (
      <div class={styles.page}>
        {header()}
        <p class={styles.message}>
          {state.status === 'loading' ? 'Cargando…' : 'No se han podido cargar las rutinas.'}
        </p>
      </div>
    )
  }

  const p = state.profile
  const intro = p
    ? [`${p.daysPerWeek} días por semana`, `nivel ${LEVEL[p.level]}`, p.phase ? PHASE[p.phase] : null]
        .filter(Boolean)
        .join(' · ')
    : undefined

  return (
    <div class={styles.page}>
      {header(intro)}
      {state.notice && (
        <p class={styles.notice} role="note">
          {state.notice}
        </p>
      )}

      {state.featured && (
        <section class={styles.section} aria-label="Para ti">
          <h2 class={styles.sectionTitle}>Para ti</h2>
          <div class={styles.list}>
            <PhotoCard
              title={state.featured.entry.title}
              subtitle={`${state.featured.lines[0]} · ${state.featured.lines[1]}`}
              tone={state.featured.entry.tone}
              badge={state.featured.entry.id === state.currentId ? 'Tu rutina' : 'Recomendada'}
              onClick={() => route(paths.routineDetail(state.featured!.entry.id))}
              action={infoButton(state.featured.entry.title, aboutOf(state.featured.entry))}
            />
          </div>
        </section>
      )}

      <section class={styles.section} aria-label="Tipos de entrenamiento">
        <h2 class={styles.sectionTitle}>Tipos de entrenamiento</h2>
        <div class={styles.list}>
          {state.categories.map(({ category, count, forYou }) => (
            <PhotoCard
              key={category.id}
              title={category.title}
              subtitle={`${countLabel(count)}${forYou ? ` · ${forYou} de tus días` : ''}`}
              tone={category.tone}
              onClick={() => route(paths.routineCategory(category.id))}
              action={infoButton(category.title, category.about)}
            />
          ))}
        </div>
      </section>

      {infoSheet.open && info && (
        <Sheet title={info.title} onClose={infoSheet.close}>
          <RoutineAbout about={info.about} />
        </Sheet>
      )}
    </div>
  )
}
