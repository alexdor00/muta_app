import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import {
  formatChange,
  formatClock,
  formatDayDate,
  formatDecimal,
  formatRange,
  localDate,
} from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronLeftIcon, PlayIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import {
  FichaCabecera,
  FichaClave,
  FichaNotas,
  FichaMusculos,
  FichaRecord,
  FichaSugerencia,
} from '../../components/ExerciseFicha.tsx'
import { SessionProgress } from '../../../../shared/ui/SessionProgress.tsx'
import { NoteSheet } from '../../components/WorkoutSheets.tsx'
import { fichaDe } from '../../state/ficha.ts'
import { descansoDe, pedirEjercicio } from '../../state/sesionEnCurso.ts'
import {
  avisoDeOrden,
  cambioDesdePrimera,
  MUSCLE_IDS,
  MUSCLES,
  plainEffort,
  type MuscleId,
} from '../../state/routines.ts'
import { ejercicioDeBiblioteca } from '../../use-cases/exerciseLibrary.ts'
import { guardarNota, notaDe } from '../../use-cases/exerciseNotes.ts'
import { pautaEnTuRutina } from '../../use-cases/training.ts'
import { usePlan } from '../comun/usePlan.ts'
import type { AvisoFicha } from './MasFichaHoja.tsx'
import styles from './FichaEjercicioScreen.module.css'

const NOMBRES = Object.fromEntries(MUSCLE_IDS.map((id) => [id, MUSCLES[id].label]))

/** De dónde salen las repeticiones de la ficha. */
const FUENTE = {
  plan: 'de tu plan',
  rutina: 'de tu rutina (en otra semana)',
  biblioteca: 'típicas de este ejercicio: tu rutina no lo lleva',
} as const

/**
 * Ficha del ejercicio (diseño aprobado del 2026-11-02, sin foto): nombre y pauta, la clave, el peso que toca hoy con su
 * porqué (doble progresión), cómo ha ido a lo largo del tiempo, qué músculos trabaja y tus notas; el descanso se ve en la
 * cabecera y se cambia en Editar rutina o en la sesión (usuario, 2026-11-13). Desde la sesión,
 * «Empezar ejercicio» vuelve a ella con este ejercicio abierto. Con tu plan y tus entrenos.
 */
export function FichaEjercicioScreen(props: { exerciseId: string }) {
  const { query, route } = useLocation()
  usePlan()
  const [metrica, setMetrica] = useState<'maximo' | 'volumen'>('maximo')
  const [escribiendo, setEscribiendo] = useState(false)
  const [aviso, setAviso] = useState<AvisoFicha | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  const ex = ejercicioDeBiblioteca(props.exerciseId)
  const atras = () => (window.history.length > 1 ? window.history.back() : route(paths.training))
  if (!ex) {
    return (
      <Pending code="404" title="Este ejercicio no está en la biblioteca">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const f = fichaDe(ex, pautaEnTuRutina(ex.id))
  const musculos = (min: number, max: number) =>
    (Object.entries(ex.contributes) as [MuscleId, number][])
      .filter(([, c]) => c >= min && c < max)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
  const principales = musculos(1, Infinity)
  const secundarios = musculos(0.5, 1)
  const descanso = f.plan ? descansoDe(f.plan.e) : ex.restSec

  const orden = avisoDeOrden(f.progreso)
  const puestoHoy = f.progreso.at(-1)?.puesto
  /** Lo de cada gráfica: la cifra de la última vez, el cambio desde la primera, su fecha y sus puntos. */
  const grafica = (m: 'maximo' | 'volumen') => {
    // El tonelaje, en toneladas (la cifra y el eje igual)
    const puntos = f.progreso.map((p) => ({
      fecha: p.fecha,
      valor: m === 'volumen' ? p.volumen / 1000 : p.maximo,
      // Al pasar el dedo por el 1RM: la serie que lo dio ese día
      nota:
        m === 'maximo'
          ? `Mejor serie: ${p.mejor.kg != null ? `${formatDecimal(p.mejor.kg)} kg × ` : ''}${p.mejor.reps}${p.mejor.kg == null ? ' reps' : ''}`
          : undefined,
    }))
    const ultimo = puntos.at(-1)
    const cambio = cambioDesdePrimera(puntos.map((p) => p.valor))
    const texto = (v: number) =>
      m === 'volumen'
        ? `${formatDecimal(Math.round(v * 10) / 10)} t`
        : `${formatDecimal(Math.round(v))} ${f.pesoCorporal ? 'reps' : 'kg'}`
    return {
      valor: ultimo ? texto(ultimo.valor) : null,
      cambio: cambio === null ? null : `${formatChange(cambio)} desde la primera vez`,
      fecha: ultimo ? formatDayDate(ultimo.fecha) : null,
      puntos,
      texto,
    }
  }

  // Tu récord (usuario, 2026-11-20): el día de tu mejor 1RM, cuando ya hay con qué compararlo
  const record = f.progreso.length > 1 ? f.progreso.reduce((m, p) => (p.maximo > m.maximo ? p : m)) : null
  const pieRecord =
    record && metrica === 'maximo' ? (
      <FichaRecord
        valor={grafica('maximo').texto(record.maximo)}
        fecha={record.fecha === localDate(new Date()) ? 'hoy' : formatDayDate(record.fecha).toLowerCase()}
      />
    ) : null

  const METRICAS = [
    // En el botón, el nombre corto; arriba de la gráfica, el largo
    {
      value: 'maximo' as const,
      label: f.pesoCorporal ? 'Mejor serie' : '1RM',
      titulo: f.pesoCorporal ? 'Mejor serie' : '1RM estimado',
    },
    { value: 'volumen' as const, label: 'Tonelaje', titulo: 'Tonelaje total' },
  ]

  const sesion = typeof query.sesion === 'string' ? query.sesion : null
  const indice = Number(query.ej)
  const empezar = () => {
    if (Number.isInteger(indice)) pedirEjercicio(indice)
    atras()
  }

  return (
    <div class={`${styles.page} ${sesion ? styles.withFooter : ''}`}>
      <header class={styles.bar}>
        <button type="button" class={styles.back} aria-label="Volver" onClick={atras}>
          <ChevronLeftIcon />
        </button>
        <h1 class={styles.barTitle}>Ficha del ejercicio</h1>
        {/* Sin «···» (usuario, 2026-11-14): el hueco deja el título centrado */}
        <span class={styles.more} aria-hidden="true" />
      </header>
      <div class={styles.cards}>
        <FichaCabecera
          nombre={ex.name}
          musculos={principales.map((id) => MUSCLES[id].label)}
          pauta={[
            ...(f.plan
              ? [
                  {
                    icono: 'series' as const,
                    texto: `${f.plan.e.series} series`,
                    etiqueta: `${f.plan.e.series} series`,
                  },
                ]
              : []),
            {
              icono: 'reps',
              texto: `${formatRange(f.rango)} reps`,
              etiqueta: `${f.rango[0] === f.rango[1] ? f.rango[0] : `${f.rango[0]} a ${f.rango[1]}`} repeticiones, ${FUENTE[f.fuente]}`,
            },
            {
              icono: 'descanso',
              texto: formatClock(descanso),
              etiqueta: `Descanso ${formatClock(descanso)}`,
            },
          ]}
          nota={`Repeticiones ${FUENTE[f.fuente]}`}
        />
        {/* Lo que progresa, arriba y en una sola gráfica: 1RM estimado (o mejor serie) y, con peso, el tonelaje con un botón */}
        <SessionProgress
          titulo={METRICAS.find((x) => x.value === metrica)?.titulo ?? ''}
          metricas={f.pesoCorporal || !f.progreso.length ? METRICAS.slice(0, 1) : METRICAS}
          etiqueta="Progreso del ejercicio"
          vacio="Aún no has hecho este ejercicio."
          {...grafica(metrica)}
          metrica={metrica}
          onMetrica={setMetrica}
          otroPuesto={f.progreso.map((p) => p.puesto !== puestoHoy)}
          pie={pieRecord}
          aviso={
            orden &&
            `⚠ La última vez lo hiciste en el puesto ${orden.ahora} de la sesión y la anterior en el ${orden.antes}: con otra fatiga encima, la comparación no es exacta.`
          }
        />
        <FichaSugerencia
          etiqueta={f.sugerencia.etiqueta}
          valor={f.sugerencia.valor}
          porque={f.sugerencia.porque}
        />
        <FichaMusculos
          principales={principales.map((id) => ({ id, label: MUSCLES[id].label }))}
          secundarios={secundarios.map((id) => ({ id, label: MUSCLES[id].label }))}
          onMusculo={(id) => route(paths.muscle(id))}
          series={Object.fromEntries([
            ...principales.map((id) => [id, 3]),
            ...secundarios.map((id) => [id, 1]),
          ])}
          names={NOMBRES}
        />
        {ex.key && (
          <FichaClave texto={plainEffort(ex.key)} fuente={ex.deRutina ? ex.source : null} web={ex.keyWeb} />
        )}
        <FichaNotas texto={notaDe(ex.name)} onEscribir={() => setEscribiendo(true)} />
      </div>
      {sesion && (
        <div class={styles.footer}>
          <Button onClick={empezar}>
            <span class={styles.startLabel}>
              <PlayIcon />
              Empezar ejercicio
            </span>
          </Button>
        </div>
      )}
      <Toast
        message={aviso?.texto ?? null}
        action={
          aviso?.deshacer
            ? {
                label: 'Deshacer',
                onClick: () => {
                  aviso.deshacer?.()
                  setAviso({ texto: 'Deshecho' })
                },
              }
            : null
        }
      />
      {escribiendo && (
        <NoteSheet
          nombre={ex.name}
          nota={notaDe(ex.name)}
          onGuardar={(t) => {
            void guardarNota(ex.name, t)
            setEscribiendo(false)
          }}
          onClose={() => setEscribiendo(false)}
        />
      )}
    </div>
  )
}
