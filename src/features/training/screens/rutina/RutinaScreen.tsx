import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { ChevronDownIcon, InfoIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import { SlotPanel } from '../../components/SlotPanel.tsx'
import { aboutOf, CATEGORIES, routineDetail } from '../../state/routines.ts'
import { openRoutine } from '../../use-cases/routineDetail.ts'
import { slotPanel } from '../../use-cases/slotPanel.ts'
import { startOpenRoutine } from '../../use-cases/startRoutine.ts'
import styles from './RutinaScreen.module.css'

const STATUS = { added: 'Añadido', removed: null, changed: 'Ajustado', same: null } as const

/**
 * Detalle de una rutina: datos clave, estructura por fases, semanas y días, y «Empezar esta rutina».
 * Los ejercicios que se pueden cambiar salen con un gris más oscuro y, al pulsarlos, se despliegan
 * con sus opciones (opcionales de MUTA, puntos débiles de Culturismo y de Torso y pierna).
 */
export function RutinaScreen(props: { id: string }) {
  const { route } = useLocation()
  const hero = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(0)
  const [week, setWeek] = useState(0)
  /** Fila desplegada (fase-semana-día-fila) o el panel de prioridades. */
  const [open, setOpen] = useState<string | null>(null)
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

  const { item, phases, facts } = state
  const { entry } = item
  const back = paths.routineCategory(item.categories[0] ?? 'muta')
  const about = aboutOf(entry)
  const currentPhase = phases[Math.min(phase, phases.length - 1)]
  const currentWeek = currentPhase.weeks[Math.min(week, currentPhase.weeks.length - 1)]
  const toggle = (id: string) => setOpen((now) => (now === id ? null : id))

  async function begin() {
    if (await startOpenRoutine()) route(paths.training)
  }

  const anySlot = currentWeek.days.some(
    (d) => d.type === 'session' && d.exercises.some((e) => e.slot || e.tip),
  )

  type Days = typeof currentWeek.days
  const renderDays = (days: Days, wk: number) => (
    <ol class={styles.days}>
      {days.map((day, i) =>
        day.type === 'rest' ? (
          <li key={`d${i}`} class={styles.rest}>
            {day.note}
          </li>
        ) : (
          <li key={`s${i}`} class={styles.session}>
            <details open={day.exercises.some((e) => e.slot)}>
              <summary class={styles.summary}>
                <span class={styles.sessionName}>{day.name}</span>
                <span class={styles.sessionMeta}>
                  {day.exercises.filter((e) => e.status !== 'removed').length} ejercicios · ~{day.minutes} min
                </span>
              </summary>
              <ul class={styles.exercises}>
                {day.exercises.map((e, j) => {
                  const id = `${phase}-${wk}-${i}-${j}`
                  const panel = e.slot ? slotPanel(e.slot) : null
                  const body = (
                    <>
                      <span class={styles.exName}>
                        {e.name}
                        {STATUS[e.status] && <span class={styles.tag}>{STATUS[e.status]}</span>}
                      </span>
                      <span class={styles.exMeta}>
                        {[e.prescription, e.effort].filter(Boolean).join(' · ')}
                        {e.before && <span class={styles.before}> (antes: {e.before})</span>}
                      </span>
                    </>
                  )
                  if (!panel && !e.tip) {
                    return (
                      <li
                        key={j}
                        class={`${styles.exercise} ${e.status === 'removed' ? styles.removed : ''}`}
                      >
                        {body}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={j}
                      class={`${styles.exercise} ${styles.slotItem} ${e.status === 'removed' ? styles.removed : ''} ${open === id ? styles.open : ''}`}
                    >
                      <button
                        type="button"
                        class={styles.slotRow}
                        aria-expanded={open === id}
                        onClick={() => toggle(id)}
                      >
                        <span class={styles.slotText}>{body}</span>
                        <span class={styles.chevron}>
                          <ChevronDownIcon />
                        </span>
                      </button>
                      {open === id && (
                        <div class={styles.slotPanel}>
                          {panel && <SlotPanel id={id} {...panel} />}
                          {e.tip && <p class={styles.tipText}>{e.tip}</p>}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </details>
          </li>
        ),
      )}
    </ol>
  )
  const differ = currentPhase.weeks.length > 1 && currentPhase.differ

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
        {anySlot && (
          <p class={styles.hintLine}>
            Los ejercicios con fondo gris oscuro se pueden elegir o quitar, o llevan una indicación: púlsalos.
          </p>
        )}
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
        {currentPhase.weeks.length > 1 && !differ && (
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

        {differ ? (
          <div class={styles.weekList}>
            {currentPhase.weeks.map((w, wi) => (
              <details key={w.week} class={styles.week} open={wi === 0}>
                <summary class={styles.weekTitle}>Semana {w.week}</summary>
                {renderDays(w.days, wi)}
              </details>
            ))}
          </div>
        ) : (
          renderDays(currentWeek.days, week)
        )}
      </section>

      <div class={styles.footer}>
        <Button onClick={() => void begin()}>Empezar esta rutina</Button>
      </div>
    </div>
  )
}
