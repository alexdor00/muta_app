import { useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { RoutineList } from '../../components/RoutineList.tsx'
import { FAMILIES, routines } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const SECTION_TITLE = { 'para-ti': 'Para ti', 'cinco-dias': 'De 5 días', otras: 'De otros días' } as const
type Section = keyof typeof SECTION_TITLE

/**
 * Las versiones de un tipo de entrenamiento. Arriba las de la sección desde la que se
 * entró (para ti, 5 días u otros días) y debajo el resto de la familia.
 */
export function FamiliaRutinaScreen(props: { family: string; query?: Record<string, string> }) {
  const { route } = useLocation()
  useEffect(() => {
    if (routines.value.status !== 'ready') void loadRoutines()
  }, [])
  const state = routines.value
  const family = FAMILIES.find((f) => f.id === props.family)
  const section: Section =
    (props.query?.seccion as Section) in SECTION_TITLE ? (props.query!.seccion as Section) : 'para-ti'

  if (!family) {
    return (
      <div class={styles.page}>
        <ScreenHeader title="Este tipo de rutina no existe" avatarHref={paths.profile} />
        <p class={styles.message}>
          <a href={paths.chooseRoutine}>Volver a elegir rutina</a>
        </p>
      </div>
    )
  }

  const header = <ScreenHeader title={family.title} intro={family.description} avatarHref={paths.profile} />
  if (state.status !== 'ready') {
    return (
      <div class={styles.page}>
        {header}
        <p class={styles.message}>
          {state.status === 'loading' ? 'Cargando…' : 'No se han podido cargar las rutinas.'}
        </p>
      </div>
    )
  }

  const bySection: Record<Section, typeof state.recommended> = {
    'para-ti': state.recommended,
    'cinco-dias': state.alsoAllowed,
    otras: state.others,
  }
  async function choose(id: string) {
    if (state.status !== 'ready') return
    try {
      await chooseRoutine(id, state.adjusted.has(id) ? (state.profile?.level ?? null) : null)
      route(paths.training)
    } catch (error) {
      logError(error, 'elegir rutina')
    }
  }

  const inFamily = (list: typeof state.recommended) => list.filter((e) => e.family === family.id)
  const first = inFamily(bySection[section])
  const rest = (Object.keys(bySection) as Section[])
    .filter((s) => s !== section)
    .flatMap((s) => inFamily(bySection[s]))

  return (
    <div class={styles.page}>
      <p class={styles.back}>
        <a href={paths.chooseRoutine}>‹ Tipos de rutina</a>
      </p>
      {header}
      {first.length > 0 && (
        <section class={styles.section} aria-label={SECTION_TITLE[section]}>
          <h2 class={styles.sectionTitle}>{SECTION_TITLE[section]}</h2>
          <RoutineList
            entries={first}
            adjusted={state.adjusted}
            currentId={state.currentId}
            onChoose={(id) => void choose(id)}
          />
        </section>
      )}
      {rest.length > 0 && (
        <section class={styles.section} aria-label="Más de este tipo">
          <h2 class={styles.sectionTitle}>Más de este tipo</h2>
          <RoutineList
            entries={rest}
            adjusted={state.adjusted}
            currentId={state.currentId}
            onChoose={(id) => void choose(id)}
          />
        </section>
      )}
    </div>
  )
}
