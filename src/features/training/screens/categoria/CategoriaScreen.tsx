import { useEffect, useRef, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { HeroHeader } from '../../../../shared/ui/HeroHeader.tsx'
import { BookmarkIcon, InfoIcon, SlidersIcon } from '../../../../shared/ui/icons.tsx'
import { ListRow } from '../../../../shared/ui/ListRow.tsx'
import { PillButton } from '../../../../shared/ui/PillButton.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import {
  aboutOf,
  activeFilters,
  CATEGORIES,
  matches,
  routines,
  SPLIT_LABEL,
  type Filters,
  type RoutineItem,
  type Split,
} from '../../state/routines.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import { toggleSaved } from '../../use-cases/toggleSaved.ts'
import styles from './CategoriaScreen.module.css'

const SAVED = {
  id: 'guardadas',
  title: 'Guardadas',
  description: 'Las rutinas que has marcado para verlas luego.',
  tone: 1 as const,
}

const ALL = 'todos'
type Option = { value: string; label: string }
const DAY_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  ...[2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d} días` })),
]
const SPLIT_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  ...(Object.keys(SPLIT_LABEL) as Split[]).map((s) => ({ value: s, label: SPLIT_LABEL[s] })),
]
const DURATION_OPTIONS: Option[] = [
  { value: ALL, label: 'Todas' },
  { value: 'corta', label: 'Hasta 45 min' },
  { value: 'media', label: '50–65 min' },
  { value: 'larga', label: '70 min o más' },
]
const VOLUME_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
]
const BASICS_OPTIONS: Option[] = [
  { value: ALL, label: 'Todas' },
  { value: 'si', label: 'Mejoran los básicos' },
]
const CYCLE_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'rota', label: 'Rota (no semanal)' },
]

const thumbDays = (days: number[]) =>
  days.length > 1 ? `${Math.min(...days)}–${Math.max(...days)}` : String(days[0])

/**
 * Rutinas de un tipo de entrenamiento (o las guardadas): cabecera con foto, número de rutinas,
 * filtros y lista. Arriba las de tus días. Al bajar aparece una barra compacta.
 */
export function CategoriaScreen(props: { category: string }) {
  const hero = useRef<HTMLElement>(null)
  const filtersSheet = useSheet('filtros')
  const infoSheet = useSheet('info')
  const [info, setInfo] = useState<RoutineItem | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  useEffect(() => {
    if (routines.value.status !== 'ready') void loadRoutines()
  }, [])

  const state = routines.value
  const category = props.category === SAVED.id ? SAVED : CATEGORIES.find((c) => c.id === props.category)
  if (!category) {
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
        : state.items.filter((i) => i.categories.includes(category.id as never))
  const shown = inCategory.filter((i) => matches(i, filters))
  const active = activeFilters(filters)
  const set = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value === ALL ? undefined : key === 'days' ? Number(value) : value }))
  const value = (key: keyof Filters) => (filters[key] === undefined ? ALL : String(filters[key]))

  const filterButton = (
    <RoundButton label="Filtros" variant="plain" onClick={filtersSheet.show}>
      <SlidersIcon />
    </RoundButton>
  )

  return (
    <div class={styles.page}>
      <CompactBar title={category.title} backHref={paths.chooseRoutine} action={filterButton} watch={hero} />
      <HeroHeader
        title={category.title}
        description={category.description}
        tone={category.tone}
        backHref={paths.chooseRoutine}
        heroRef={hero}
      />

      <div class={styles.toolbar}>
        <p class={styles.count}>
          {state.status === 'loading'
            ? 'Cargando…'
            : `${shown.length} ${shown.length === 1 ? 'rutina' : 'rutinas'}`}
        </p>
        <PillButton icon={<SlidersIcon />} count={active} onClick={filtersSheet.show}>
          Filtros
        </PillButton>
      </div>

      {shown.length > 0 ? (
        <ul class={styles.list}>
          {shown.map((item) => {
            const saved = state.status === 'ready' && state.saved.has(item.entry.id)
            const current = state.status === 'ready' && state.currentId === item.entry.id
            return (
              <ListRow
                key={item.entry.id}
                title={item.entry.title}
                lines={aboutOf(item.entry)?.basics ? [...item.lines, 'Mejora los básicos'] : item.lines}
                eyebrow={current ? 'Tu rutina' : item.recommended ? 'Para tus días' : undefined}
                href={paths.routineDetail(item.entry.id)}
                tone={item.entry.tone}
                thumbBig={thumbDays(item.entry.days)}
                thumbSmall="días"
                trailing={
                  <span class={styles.actions}>
                    {aboutOf(item.entry) && (
                      <RoundButton
                        label={`De qué trata ${item.entry.title}`}
                        variant="plain"
                        onClick={() => {
                          setInfo(item)
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
          })}
        </ul>
      ) : (
        state.status === 'ready' && (
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
      )}

      {infoSheet.open && info && aboutOf(info.entry) && (
        <Sheet title={info.entry.title} onClose={infoSheet.close}>
          <RoutineAbout about={aboutOf(info.entry)!} />
        </Sheet>
      )}
      {filtersSheet.open && (
        <Sheet
          title="Filtros"
          onClose={filtersSheet.close}
          footer={
            <div class={styles.sheetActions}>
              <Button
                onClick={filtersSheet.close}
              >{`Ver ${shown.length} ${shown.length === 1 ? 'rutina' : 'rutinas'}`}</Button>
              {active > 0 && (
                <Button variant="secondary" onClick={() => setFilters({})}>
                  Quitar filtros
                </Button>
              )}
            </div>
          }
        >
          <div class={styles.filters}>
            <ChoiceChips
              name="f-dias"
              legend="Días por semana"
              showLegend
              options={DAY_OPTIONS}
              value={value('days')}
              onChange={(v) => set('days', v)}
            />
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
