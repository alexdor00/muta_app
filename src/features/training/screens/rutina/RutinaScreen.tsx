import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
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
import { SlotPanel, type SlotPanelProps } from '../../components/SlotPanel.tsx'
import {
  aboutOf,
  CATEGORIES,
  restFact,
  weeksDiffer,
  withSuggestedRests,
  routineDetail,
  type PriorityChoice,
  type Slot,
  type WeakChoice,
} from '../../state/routines.ts'
import { chooseRoutine } from '../../use-cases/chooseRoutine.ts'
import { openRoutine, setPriorities, setWeakPoints } from '../../use-cases/routineDetail.ts'
import styles from './RutinaScreen.module.css'

const STATUS = { added: 'Añadido', removed: null, changed: 'Ajustado', same: null } as const
const NO_PRIORITY: PriorityChoice = { priorities: [], optionals: {} }

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

  const { item, phases, weak, priorities, choice, rest } = state
  const { entry, info } = item
  const back = paths.routineCategory(item.categories[0] ?? 'muta')
  const about = aboutOf(entry)
  const currentPhase = phases[Math.min(phase, phases.length - 1)]
  const currentWeek = currentPhase.weeks[Math.min(week, currentPhase.weeks.length - 1)]
  const toggle = (id: string) => setOpen((now) => (now === id ? null : id))

  async function begin() {
    try {
      await chooseRoutine(entry.id, {
        weakPoints: weak?.choice ?? null,
        priorities: choice,
      })
      route(paths.training)
    } catch (error) {
      logError(error, 'empezar rutina')
    }
  }

  // ── Lo que se despliega bajo cada fila que se puede cambiar
  const prior = choice ?? NO_PRIORITY
  const setPrior = (change: Partial<PriorityChoice>) => setPriorities({ ...prior, ...change })
  const anySlot = currentWeek.days.some(
    (d) => d.type === 'session' && d.exercises.some((e) => e.slot || e.tip),
  )

  function panelFor(slot: Slot, id: string): SlotPanelProps | null {
    if (slot.kind === 'optional') {
      const o = priorities?.optionals.find((x) => x.key === slot.key)
      return {
        id,
        kind: 'optional',
        muscle: o?.muscle ?? '',
        reason: o?.reason ?? null,
        why: slot.why,
        off: slot.off,
        minutes: priorities?.minutes ?? null,
        onSet: (include) => setPrior({ optionals: { ...prior.optionals, [slot.key]: include } }),
        original: o?.name ?? '',
        options: slot.options,
        value: slot.chosen,
        onPick: (name) => {
          const rest = Object.fromEntries(
            Object.entries(prior.alternatives ?? {}).filter(([key]) => key !== slot.key),
          )
          setPrior({ alternatives: name ? { ...rest, [slot.key]: name } : rest })
        },
      }
    }
    if (slot.kind === 'weak' && weak) {
      const now = weak.choice?.mode === 'table' ? weak.choice : null
      const put = (change: Partial<{ e1: string | null; e2: string | null }>) =>
        setWeakPoints({
          mode: 'table',
          muscle: now?.muscle ?? '',
          e1: now?.e1 ?? null,
          e2: now?.e2 ?? null,
          ...change,
        })
      return {
        id,
        kind: 'weak',
        which: slot.which,
        muscles: weak.table.muscles,
        muscle: now?.muscle ?? null,
        value: slot.which === 1 ? (now?.e1 ?? null) : (now?.e2 ?? null),
        onMuscle: (muscle) => setWeakPoints({ mode: 'table', muscle, e1: null, e2: null }),
        onOption: (en) => put(slot.which === 1 ? { e1: en } : { e2: en }),
      }
    }
    if (slot.kind === 'pick' && weak) {
      const slots = weak.choice?.mode === 'pick' ? weak.choice.slots : {}
      const mine = slots[slot.day] ?? null
      const set = (value: { muscle: string; option: string } | null): WeakChoice => ({
        mode: 'pick',
        slots: { ...slots, [slot.day]: value },
      })
      const recommended =
        weak.table.mode === 'pick'
          ? `El programa recomienda ${weak.table.min} o ${weak.table.max} músculos, siempre los mismos.`
          : ''
      return {
        id,
        kind: 'pick',
        recommendation: recommended,
        muscles: weak.table.muscles,
        muscle: mine?.muscle ?? null,
        value: mine?.option || null,
        onMuscle: (muscle) => setWeakPoints(set({ muscle, option: '' })),
        onOption: (en) => setWeakPoints(set(en && mine ? { muscle: mine.muscle, option: en } : null)),
      }
    }
    return null
  }

  const sessionNames = (phases[0]?.weeks[0]?.days ?? []).flatMap((d) =>
    d.type === 'session' ? [d.name] : [],
  )
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
    ['Descanso', restFact(entry.id, info.cycle, rest, sessionNames)],
    ['Volumen', `${info.volume[0].toUpperCase()}${info.volume.slice(1)}`],
    ['Lugar', info.equipment === 'home' ? 'En casa' : 'Gimnasio'],
    ...(about?.basics ? ([['Fuerza', 'Mejora los básicos']] as [string, string][]) : []),
  ]
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
                  const panel = e.slot ? panelFor(e.slot, id) : null
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
                          {panel && <SlotPanel {...panel} />}
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
  const differ = currentPhase.weeks.length > 1 && weeksDiffer(currentPhase.weeks)

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
                {renderDays(withSuggestedRests(w.days, entry.id), wi)}
              </details>
            ))}
          </div>
        ) : (
          renderDays(withSuggestedRests(currentWeek.days, entry.id), week)
        )}
      </section>

      <div class={styles.footer}>
        <Button onClick={() => void begin()}>Empezar esta rutina</Button>
      </div>
    </div>
  )
}
