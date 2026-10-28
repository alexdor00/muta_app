import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { InfoIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import { aboutOf, CATEGORIES, routineDetail } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { openRoutine } from '../../use-cases/routineDetail.ts'
import styles from './RutinaScreen.module.css'

const STATUS = { added: 'Añadido', removed: 'Quitado', changed: 'Ajustado', same: null } as const

/**
 * Detalle de una rutina tal cual está diseñada: datos clave, estructura por fases, semanas y días con sus descansos, y «Empezar esta rutina».
 */
export function RutinaScreen(props: { id: string }) {
  const { route } = useLocation()
  const hero = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(0)
  const [week, setWeek] = useState(0)
  const infoSheet = useSheet('info')
  useEffect(() => void openRoutine(props.id), [props.id])
  const state = routineDetail.value

  if (state.status !== 'ready') {
    return (
      <div class={styles.page}>
        <p class={styles.message}>
          {state.status === 'loading' ? 'Cargando…' : 'Esta rutina no está disponible en este dispositivo.'}{' '}
          <a href={paths.chooseRoutine}>Volver</a>
        </p>
      </div>
    )
  }

  const { item, phases } = state
  const { entry, info } = item
  const back = paths.routineCategory(item.categories[0] ?? 'muta')
  const about = aboutOf(entry)
  const currentPhase = phases[Math.min(phase, phases.length - 1)]
  const currentWeek = currentPhase.weeks[Math.min(week, currentPhase.weeks.length - 1)]

  async function start() {
    try {
      await chooseRoutine(entry.id)
      route(paths.training)
    } catch (error) {
      logError(error, 'empezar rutina')
    }
  }

  const facts: [string, string][] = [
    [
      'Días',
      info.cycle.rotating
        ? `${entry.days.join('–')} por semana · rota en ${info.cycle.sessions} sesiones`
        : `${entry.days.join('–')} por semana`,
    ],
    ['Duración', `~${info.minutes} min por sesión`],
    [
      'Programa',
      info.phases.length
        ? `${info.phases.length} fases · ${info.weeks} semanas`
        : info.weeks
          ? `${info.weeks} semanas`
          : 'Se repite sin fecha de fin',
    ],
    ['Reparto', info.splitLabel],
    ['Volumen', `${info.volume[0].toUpperCase()}${info.volume.slice(1)}`],
    ['Lugar', info.equipment === 'home' ? 'En casa' : 'Gimnasio'],
  ]

  return (
    <div class={styles.page}>
      <CompactBar title={entry.title} backHref={back} watch={hero} />
      <HeroHeader
        title={entry.title}
        description={item.categories
          .map((c) => CATEGORIES.find((x) => x.id === c)?.title)
          .filter(Boolean)
          .join(' · ')}
        tone={entry.tone}
        backHref={back}
        heroRef={hero}
        action={
          about && (
            <RoundButton label="De qué trata esta rutina" onClick={infoSheet.show}>
              <InfoIcon />
            </RoundButton>
          )
        }
      />
      {infoSheet.open && about && (
        <Sheet title={entry.title} onClose={infoSheet.close}>
          <RoutineAbout about={about} />
        </Sheet>
      )}

      <dl class={styles.facts}>
        {facts.map(([label, value]) => (
          <div key={label} class={styles.fact}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section class={styles.structure} aria-label="Estructura">
        <h2 class={styles.h2}>Estructura</h2>
        {phases.length > 1 && (
          <ChoiceChips
            name="fase"
            legend="Fase"
            options={phases.map((p, i) => ({ value: String(i), label: p.title ?? `Bloque ${i + 1}` }))}
            value={String(Math.min(phase, phases.length - 1))}
            onChange={(v) => {
              setPhase(Number(v))
              setWeek(0)
            }}
          />
        )}
        {currentPhase.weeks.length > 1 && (
          <div class={styles.weeks}>
            <ChoiceChips
              name="semana"
              legend="Semana"
              options={currentPhase.weeks.map((w, i) => ({ value: String(i), label: `Semana ${w.week}` }))}
              value={String(Math.min(week, currentPhase.weeks.length - 1))}
              onChange={(v) => setWeek(Number(v))}
            />
          </div>
        )}

        <ol class={styles.days}>
          {currentWeek.days.map((day, i) =>
            day.type === 'rest' ? (
              <li key={`d${i}`} class={styles.rest}>
                {day.note}
              </li>
            ) : (
              <li key={`s${i}`} class={styles.session}>
                <details>
                  <summary class={styles.summary}>
                    <span class={styles.sessionName}>{day.name}</span>
                    <span class={styles.sessionMeta}>
                      {day.exercises.filter((e) => e.status !== 'removed').length} ejercicios · ~{day.minutes}{' '}
                      min
                    </span>
                  </summary>
                  <ul class={styles.exercises}>
                    {day.exercises.map((e, j) => (
                      <li
                        key={j}
                        class={`${styles.exercise} ${e.status === 'removed' ? styles.removed : ''}`}
                      >
                        <span class={styles.exName}>
                          {e.name}
                          {STATUS[e.status] && <span class={styles.tag}>{STATUS[e.status]}</span>}
                        </span>
                        <span class={styles.exMeta}>
                          {[e.prescription, e.effort, e.rest].filter(Boolean).join(' · ')}
                          {e.before && <span class={styles.before}> (antes: {e.before})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ),
          )}
        </ol>
      </section>

      <div class={styles.footer}>
        <Button onClick={() => void start()}>Empezar esta rutina</Button>
      </div>
    </div>
  )
}
