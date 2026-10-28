import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips, ChoicePills } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { CATEGORIES, routineDetail, type Adaptation, type Level } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { adaptRoutine, openRoutine } from '../../use-cases/routineDetail.ts'
import styles from './RutinaScreen.module.css'

const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]
const GOALS: { value: Adaptation['goal']; label: string }[] = [
  { value: 'maintain', label: 'Mantener músculo' },
  { value: 'develop', label: 'Ganar músculo' },
]
const STATUS = { added: 'Añadido', removed: 'Quitado', changed: 'Ajustado', same: null } as const

/**
 * Detalle de una rutina: datos clave, «Adaptar a mí» (nivel y objetivo de las series),
 * estructura por fases, semanas y días con sus descansos, y «Empezar esta rutina».
 */
export function RutinaScreen(props: { id: string }) {
  const { route } = useLocation()
  const hero = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(0)
  const [week, setWeek] = useState(0)
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

  const { item, adaptation, suggested, phases, changes } = state
  const { entry, info } = item
  const back = paths.routineCategory(item.categories[0] ?? 'hipertrofia')
  const currentPhase = phases[Math.min(phase, phases.length - 1)]
  const currentWeek = currentPhase.weeks[Math.min(week, currentPhase.weeks.length - 1)]

  async function start() {
    try {
      await chooseRoutine(entry.id, adaptation)
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
      />

      <dl class={styles.facts}>
        {facts.map(([label, value]) => (
          <div key={label} class={styles.fact}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section class={styles.adapt} aria-label="Adaptar a mí">
        <h2 class={styles.h2}>Adaptar a mí</h2>
        <p class={styles.text}>
          Ajusta las series de cada músculo a tu nivel y a lo que buscas, con los rangos de tu base de
          conocimiento. La rutina original no se pierde.
        </p>
        {adaptation ? (
          <>
            <div class={styles.choices}>
              <ChoicePills
                name="nivel"
                legend="Nivel"
                showLegend
                options={LEVELS}
                value={adaptation.level}
                onChange={(level) => adaptRoutine({ ...adaptation, level })}
              />
              <ChoicePills
                name="objetivo"
                legend="Las series para"
                showLegend
                options={GOALS}
                value={adaptation.goal}
                onChange={(goal) => adaptRoutine({ ...adaptation, goal })}
              />
            </div>
            {changes.length > 0 ? (
              <ul class={styles.changes} aria-label="Cambios por músculo">
                {changes.map((c) => (
                  <li key={c.muscle}>
                    <span>{c.muscle}</span>
                    <span class={styles.change}>
                      {c.before} → <b>{c.after}</b> series/semana
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p class={styles.text}>Ya encaja con tu nivel y objetivo: no hace falta cambiar nada.</p>
            )}
            <Button variant="secondary" onClick={() => adaptRoutine(null)}>
              Ver la original
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => adaptRoutine(suggested)}>
            Adaptar a mí
          </Button>
        )}
      </section>

      <section class={styles.structure} aria-label="Estructura">
        <h2 class={styles.h2}>{adaptation ? 'Tu versión' : 'Estructura'}</h2>
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
        <Button onClick={() => void start()}>
          {adaptation ? 'Empezar mi versión' : 'Empezar esta rutina'}
        </Button>
      </div>
    </div>
  )
}
