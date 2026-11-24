import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { BookmarkIcon, InfoIcon } from '../../../../shared/ui/icons.tsx'
import { PhotoCard } from '../../../../shared/ui/PhotoCard.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { CsvRoutineCard, CsvRoutineSheet } from '../../components/CsvRoutine.tsx'
import { RoutineAbout } from '../../components/RoutineAbout.tsx'
import { aboutOf, countLabel, routines, type About } from '../../state/routines.ts'
import {
  copiarInstruccionesRutina,
  empezarRutinaCsv,
  PLANTILLA_CSV,
  rutinaTuyaParecida,
  vistaCsv,
} from '../../use-cases/importRoutine.ts'
import { loadRoutines } from '../../use-cases/loadRoutines.ts'
import styles from './ElegirRutinaScreen.module.css'

const LEVEL = { beginner: 'principiante', intermediate: 'intermedio', advanced: 'avanzado' } as const
const PHASE = { bulk: 'ganar músculo', cut: 'definición', maintenance: 'mantenimiento' } as const

/**
 * Elige tu rutina: la mejor para ti arriba y, debajo, los tipos de entrenamiento.
 * Cada tipo abre su lista (con filtros); cada rutina, su detalle con «Adaptar a mí». Abajo, cargar tu propia rutina
 * desde un CSV.
 */
export function ElegirRutinaScreen() {
  const { route } = useLocation()
  useEffect(() => void loadRoutines(), [])
  const state = routines.value
  const infoSheet = useSheet('info')
  /** La «!» abierta: la de un grupo o la de la rutina recomendada. */
  const [info, setInfo] = useState<{ title: string; about: About } | null>(null)
  /** Tu rutina del CSV, leída: su nombre (el del archivo) y lo que se enseña. */
  const [csv, setCsv] = useState<{ nombre: string; vista: ReturnType<typeof vistaCsv> } | null>(null)
  const [pregunta, setPregunta] = useState<{ nombre: string; id: string; titulo: string } | null>(null)
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
          {/* La recomendada, como «Tu objetivo, listo» de la bienvenida: tarjeta blanca con su foto, sus datos y un botón
              (usuario, 2026-11-17: el mismo estilo que los pasos) */}
          <div class={styles.recomendada}>
            <PhotoCard
              title={state.featured.entry.title}
              subtitle=""
              tone={state.featured.entry.tone}
              badge={state.featured.entry.id === state.currentId ? 'Tu rutina' : 'Recomendada'}
              onClick={() => route(paths.routineDetail(state.featured!.entry.id))}
              action={infoButton(state.featured.entry.title, aboutOf(state.featured.entry))}
            />
            <ul class={styles.datos}>
              {state.featured.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <Button href={paths.routineDetail(state.featured.entry.id)}>Ver esta rutina</Button>
          </div>
        </section>
      )}

      <section class={styles.section} aria-label="Tipos de entrenamiento">
        <h2 class={styles.sectionTitle}>O elige otro tipo</h2>
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

      <section class={styles.section} aria-label="Tu propia rutina">
        <CsvRoutineCard
          plantilla={PLANTILLA_CSV}
          onCopiar={copiarInstruccionesRutina}
          onArchivo={(nombre, texto) => setCsv({ nombre, vista: vistaCsv(texto) })}
        />
      </section>

      {csv && (
        <CsvRoutineSheet
          nombre={csv.nombre}
          errores={csv.vista.errores}
          dias={csv.vista.dias}
          resumen={csv.vista.resumen}
          onEmpezar={async (nombre) => {
            // ¿Es tu rutina de antes? (usuario, 2026-11-23): si se llama igual o lleva lo mismo, se pregunta
            const parecida = await rutinaTuyaParecida(nombre, csv.vista.programa)
            if (parecida) return setPregunta({ nombre, id: parecida.id, titulo: parecida.title })
            if (await empezarRutinaCsv(nombre, csv.vista.programa)) route(paths.training)
          }}
          onClose={() => setCsv(null)}
        />
      )}

      {pregunta && csv && (
        <Sheet title={`¿Es tu rutina «${pregunta.titulo}» de antes?`} onClose={() => setPregunta(null)}>
          <p class={styles.pregunta}>
            Se llama igual o lleva los mismos ejercicios. Si es la misma, su historia sigue y sus etapas se
            comparan con las de antes; si no, empieza como una rutina nueva.
          </p>
          <div class={styles.preguntaBotones}>
            <Button
              onClick={async () => {
                if (await empezarRutinaCsv(pregunta.nombre, csv.vista.programa, new Date(), pregunta.id))
                  route(paths.training)
              }}
            >
              Sí, es la misma
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (await empezarRutinaCsv(pregunta.nombre, csv.vista.programa)) route(paths.training)
              }}
            >
              No, es otra
            </Button>
          </div>
        </Sheet>
      )}

      {infoSheet.open && info && (
        <Sheet title={info.title} onClose={infoSheet.close}>
          <RoutineAbout about={info.about} />
        </Sheet>
      )}
    </div>
  )
}
