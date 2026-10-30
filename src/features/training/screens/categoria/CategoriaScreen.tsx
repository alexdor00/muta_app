import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips, ChoiceCircles } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { BookmarkIcon, InfoIcon, SlidersIcon } from '../../../../shared/ui/icons.tsx'
import { ListRow } from '../../../../shared/ui/ListRow.tsx'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { PillButton } from '../../../../shared/ui/PillButton.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { DayPicker } from '../../components/DayPicker.tsx'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import {
  ALL_SECTION,
  aboutOf,
  activeFilters,
  CATEGORIES,
  compactMeta,
  countLabel,
  daysOf,
  daysRange,
  inSection,
  matches,
  pickDays,
  routines,
  sectionAbout,
  sectionsOf,
  type Filters,
  type About,
  type RoutineItem,
} from '../../state/routines.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import { toggleSaved } from '../../use-cases/toggleSaved.ts'
import styles from './CategoriaScreen.module.css'
import {
  ALL,
  BASICS_OPTIONS,
  CYCLE_OPTIONS,
  DAY_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  SPLIT_OPTIONS,
  VOLUME_OPTIONS,
} from './filterOptions.ts'

const SAVED = {
  id: 'guardadas' as const,
  title: 'Guardadas',
  description: 'Las rutinas que has marcado para verlas luego.',
  tone: 1 as const,
}

/**
 * Rutinas de un tipo de entrenamiento (o las guardadas): cabecera con foto, número de rutinas,
 * filtros y lista. Arriba las de tus días. Al bajar aparece una barra compacta.
 * Cada tipo se recorre por frecuencia: se elige los días por semana y salen las rutinas de esos días. Mujer e
 * Hipertrofia, que tienen muchas, se dividen antes en categorías con tarjeta y «Ver todas» lleva a la lista
 * completa. Los filtros están en todos los niveles. La «!» de una tarjeta o de una fila abre su explicación.
 */
export function CategoriaScreen(props: { category: string; section?: string }) {
  const { route } = useLocation()
  const hero = useRef<HTMLElement>(null)
  const filtersSheet = useSheet('filtros')
  const infoSheet = useSheet('info')
  /** La «!» abierta: la de una rutina o la de una categoría. */
  const [info, setInfo] = useState<{ title: string; about: About } | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [pickedDays, setPickedDays] = useState<number | undefined>()
  useEffect(() => {
    if (routines.value.status !== 'ready') void loadRoutines()
  }, [])
  // Al cambiar de categoría o de sección (misma pantalla) se parte de cero
  useEffect(() => {
    setFilters({})
    setPickedDays(undefined)
  }, [props.category, props.section])

  const state = routines.value
  const category = props.category === SAVED.id ? SAVED : CATEGORIES.find((c) => c.id === props.category)
  const sections = sectionsOf(props.category)
  const all = props.section === ALL_SECTION
  const chosen = sections.find((s) => s.id === props.section)
  // Un tipo con una sola sección (todos menos Mujer) no tiene tarjetas: se entra directo en ella
  const section = chosen ?? (!props.section && sections.length === 1 ? sections[0] : undefined)
  if (!category || (props.section && !all && !chosen)) {
    return (
      <div class={styles.page}>
        <p class={styles.message}>
          Este tipo de rutina no existe. <a href={paths.chooseRoutine}>Volver</a>
        </p>
      </div>
    )
  }

  const inCategory: RoutineItem[] =
    state.status !== 'ready'
      ? []
      : category.id === SAVED.id
        ? state.items.filter((i) => state.saved.has(i.entry.id))
        : state.items.filter((i) => i.categories.includes(category.id))
  const active = activeFilters(filters)
  const matching = (section ? inSection(section, inCategory) : inCategory).filter((i) => matches(i, filters))
  // «cards»: las categorías del tipo · «section»: una categoría · «list»: la lista plana
  const view = section ? 'section' : sections.length > 0 && !all && active === 0 ? 'cards' : 'list'

  const profileDays = state.status === 'ready' ? state.profile?.daysPerWeek : undefined
  const days = section?.byDays ? daysOf(matching) : []
  const day = days.length > 0 ? pickDays(days, pickedDays ?? profileDays) : undefined
  const results = day === undefined ? matching : matching.filter((i) => i.entry.days.includes(day))

  const count = view === 'cards' ? inCategory.length : matching.length
  const set = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value === ALL ? undefined : key === 'days' ? Number(value) : value }))
  const value = (key: keyof Filters) => (filters[key] === undefined ? ALL : String(filters[key]))

  const filterButton = (
    <RoundButton label="Filtros" variant="plain" onClick={filtersSheet.show}>
      <SlidersIcon />
    </RoundButton>
  )

  const row = (item: RoutineItem) => {
    const saved = state.status === 'ready' && state.saved.has(item.entry.id)
    const current = state.status === 'ready' && state.currentId === item.entry.id
    const about = aboutOf(item.entry)
    const basics = !!about?.basics
    // Fila corta: el volumen como etiqueta y una línea con lo que cuesta
    const compact = compactMeta(item.info)
    return (
      <ListRow
        key={item.entry.id}
        title={item.entry.title}
        chips={[compact.chip, ...(basics ? ['Mejora los básicos'] : [])]}
        lines={[compact.line]}
        eyebrow={current ? 'Tu rutina' : item.recommended ? 'Para tus días' : undefined}
        href={paths.routineDetail(item.entry.id)}
        tone={item.entry.tone}
        thumbBig={daysRange(item.entry.days)}
        thumbSmall="días"
        trailing={
          <span class={styles.actions}>
            {about && (
              <RoundButton
                label={`De qué trata ${item.entry.title}`}
                variant="plain"
                onClick={() => {
                  setInfo({ title: item.entry.title, about })
                  infoSheet.show()
                }}
              >
                <InfoIcon />
              </RoundButton>
            )}
            <RoundButton
              label={saved ? 'Quitar de guardadas' : 'Guardar'}
              variant="plain"
              pressed={saved}
              onClick={() => void toggleSaved(item.entry.id)}
            >
              <BookmarkIcon filled={saved} />
            </RoundButton>
          </span>
        }
      />
    )
  }

  const empty = (
    <div class={styles.empty}>
      <p>
        {active
          ? 'Ninguna rutina con estos filtros.'
          : category.id === SAVED.id
            ? 'Aún no has guardado ninguna rutina.'
            : 'No hay rutinas de este tipo.'}
      </p>
      {active > 0 && (
        <Button variant="secondary" onClick={() => setFilters({})}>
          Quitar filtros
        </Button>
      )}
    </div>
  )

  // Dentro de una categoría de Mujer (o de «Ver todas») se vuelve al tipo; en el resto, a «Elige tu rutina»
  const back = props.section ? paths.routineCategory(category.id) : paths.chooseRoutine
  const nested = props.section && section ? section : undefined
  const title = nested ? nested.title : category.title

  return (
    <div class={styles.page}>
      <CompactBar title={title} backHref={back} action={filterButton} watch={hero} />
      <HeroHeader
        title={title}
        description={nested?.description ?? category.description}
        tone={nested ? nested.tone : category.tone}
        backHref={back}
        heroRef={hero}
      />

      <div class={styles.toolbar}>
        <p class={styles.count}>{state.status === 'loading' ? 'Cargando…' : countLabel(count)}</p>
        <PillButton icon={<SlidersIcon />} count={active} onClick={filtersSheet.show}>
          Filtros
        </PillButton>
      </div>

      {view === 'cards' && state.status === 'ready' && (
        <>
          <div class={styles.cards}>
            {sections.map((s) => {
              const inside = inSection(s, inCategory)
              const n = inside.length
              const about = sectionAbout(s, inside)
              return (
                n > 0 && (
                  <PhotoCard
                    key={s.id}
                    title={s.title}
                    subtitle={[s.description, countLabel(n)].filter(Boolean).join(' · ')}
                    tone={s.tone}
                    onClick={() => route(paths.routineSection(category.id, s.id))}
                    action={
                      about && (
                        <RoundButton
                          label={`De qué trata ${s.title}`}
                          variant="ghost"
                          onClick={() => {
                            setInfo({ title: s.title, about })
                            infoSheet.show()
                          }}
                        >
                          <InfoIcon />
                        </RoundButton>
                      )
                    }
                  />
                )
              )
            })}
          </div>
          <div class={styles.all}>
            <Button variant="secondary" href={paths.routineSection(category.id, ALL_SECTION)}>
              {`Ver todas las rutinas (${inCategory.length})`}
            </Button>
          </div>
        </>
      )}

      {view === 'section' && day !== undefined && days.length > 1 && (
        <DayPicker
          eyebrow={nested ? `${category.title} / ${nested.title}` : category.title}
          title="Elige tu frecuencia"
          hint="Programas según tus días disponibles."
          days={days}
          value={day}
          onChange={setPickedDays}
        />
      )}

      {view !== 'cards' &&
        (results.length === 0 ? (
          state.status === 'ready' && empty
        ) : (
          <ul class={styles.list}>{results.map(row)}</ul>
        ))}

      {infoSheet.open && info && (
        <Sheet title={info.title} onClose={infoSheet.close}>
          <RoutineAbout about={info.about} />
        </Sheet>
      )}
      {filtersSheet.open && (
        <Sheet
          title="Filtros"
          onClose={filtersSheet.close}
          footer={
            <div class={styles.sheetActions}>
              <Button onClick={filtersSheet.close}>{`Ver ${countLabel(count)}`}</Button>
              {active > 0 && (
                <Button variant="secondary" onClick={() => setFilters({})}>
                  Quitar filtros
                </Button>
              )}
            </div>
          }
        >
          <div class={styles.filters}>
            {sections.length > 0 ? (
              <ChoiceCircles
                name="f-dias"
                legend="Días por semana"
                showLegend
                options={daysOf(inCategory).map((d) => ({ value: d, label: String(d) }))}
                value={filters.days ?? 0}
                onChange={(d) => setFilters((f) => ({ ...f, days: d }))}
              />
            ) : (
              <ChoiceChips
                name="f-dias"
                legend="Días por semana"
                showLegend
                options={DAY_OPTIONS}
                value={value('days')}
                onChange={(v) => set('days', v)}
              />
            )}
            {sections.length > 0 && (
              <ChoiceChips
                name="f-equipamiento"
                legend="Equipamiento"
                showLegend
                options={EQUIPMENT_OPTIONS}
                value={value('equipment')}
                onChange={(v) => set('equipment', v)}
              />
            )}
            <ChoiceChips
              name="f-reparto"
              legend="Reparto"
              showLegend
              options={SPLIT_OPTIONS}
              value={value('split')}
              onChange={(v) => set('split', v)}
            />
            <ChoiceChips
              name="f-duracion"
              legend="Duración por sesión"
              showLegend
              options={DURATION_OPTIONS}
              value={value('duration')}
              onChange={(v) => set('duration', v)}
            />
            <ChoiceChips
              name="f-volumen"
              legend="Volumen"
              showLegend
              options={VOLUME_OPTIONS}
              value={value('volume')}
              onChange={(v) => set('volume', v)}
            />
            <ChoiceChips
              name="f-ciclo"
              legend="Ciclo"
              showLegend
              options={CYCLE_OPTIONS}
              value={value('cycle')}
              onChange={(v) => set('cycle', v)}
            />
            <ChoiceChips
              name="f-basicos"
              legend="Fuerza"
              showLegend
              options={BASICS_OPTIONS}
              value={value('basics')}
              onChange={(v) => set('basics', v)}
            />
          </div>
        </Sheet>
      )}
    </div>
  )
}
