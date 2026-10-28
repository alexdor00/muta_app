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
import { WeakPointPicker } from '../../components/WeakPointPicker.tsx'
import { aboutOf, CATEGORIES, routineDetail } from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { openRoutine, setWeakPoints } from '../../use-cases/routineDetail.ts'
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
  const weakSheet = useSheet('punto-debil')
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

  const { item, phases, weak } = state
  const { entry, info } = item
  const back = paths.routineCategory(item.categories[0] ?? 'muta')
  const about = aboutOf(entry)
  const currentPhase = phases[Math.min(phase, phases.length - 1)]
  const currentWeek = currentPhase.weeks[Math.min(week, currentPhase.weeks.length - 1)]

  // Si falta algo obligatorio del punto débil, el botón principal abre el selector en vez de empezar
  const pending = !!weak && weak.required && !weak.complete

  async function start() {
    if (pending) return weakSheet.show()
    try {
      await chooseRoutine(entry.id, null, weak?.choice ?? null)
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
    ...(about?.basics ? ([['Fuerza', 'Mejora los básicos']] as [string, string][]) : []),
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

      {weak && (
        <section class={styles.weak} aria-label="Punto débil">
          <div class={styles.weakHead}>
            <h2 class={styles.h2}>Tu punto débil</h2>
            <span class={`${styles.tag} ${weak.required ? styles.required : ''}`}>
              {weak.required ? 'Obligatorio' : 'Opcional'}
            </span>
          </div>
          {weak.summary.length ? (
            <ul class={styles.summary}>
              {weak.summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p class={styles.text}>
              {weak.table.mode === 'pick'
                ? 'Elige 2 o 3 músculos y un ejercicio de cada uno; se repiten durante todo el programa.'
                : 'Elige el músculo que más quieres mejorar: los huecos de la rutina se llenan con ejercicios suyos.'}
            </p>
          )}
          <Button variant="secondary" onClick={weakSheet.show}>
            {weak.choice ? 'Cambiar mi punto débil' : 'Elegir mi punto débil'}
          </Button>
        </section>
      )}
      {weakSheet.open && weak && (
        <Sheet
          title="Tu punto débil"
          onClose={weakSheet.close}
          footer={
            <Button disabled={weak.required && !weak.complete} onClick={weakSheet.close}>
              {weak.required && !weak.complete ? 'Falta algo obligatorio' : 'Listo'}
            </Button>
          }
        >
          <WeakPointPicker
            table={weak.table}
            choice={weak.choice}
            e1Optional={weak.needs.e1Optional}
            onChange={setWeakPoints}
          />
        </Sheet>
      )}

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
        <Button onClick={() => void start()}>
          {pending ? 'Elige tu punto débil para empezar' : 'Empezar esta rutina'}
        </Button>
      </div>
    </div>
  )
}
