import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import {
  formatChange,
  formatClock,
  formatDayDate,
  formatDecimal,
  formatRange,
} from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronLeftIcon, PlayIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import {
  FichaCabecera,
  FichaClave,
  FichaDescanso,
  FichaMusculos,
  FichaSugerencia,
} from '../../components/ExerciseFicha.tsx'
import { SessionProgress } from '../../components/SessionProgress.tsx'
import { RestChoiceSheet } from '../../components/WorkoutSheets.tsx'
import { fichaDe } from '../../state/ficha.ts'
import { descansoDe, elegirDescanso, pedirEjercicio } from '../../state/sesionEnCurso.ts'
import {
  avisoDeOrden,
  cambioDesdePrimera,
  MUSCLE_IDS,
  MUSCLES,
  plainEffort,
  type MuscleId,
} from '../../state/routines.ts'
import { ejercicioDeBiblioteca } from '../../use-cases/exerciseLibrary.ts'
import { MusculoHoja } from '../musculo/MusculoHoja.tsx'
import { usePlan } from '../comun/usePlan.ts'
import styles from './FichaEjercicioScreen.module.css'

const METRICAS = [
  { value: 'maximo', label: 'Máximo' },
  { value: 'volumen', label: 'Volumen' },
] as const
type MetricaEjercicio = (typeof METRICAS)[number]['value']

const NOMBRES = Object.fromEntries(MUSCLE_IDS.map((id) => [id, MUSCLES[id].label]))

/**
 * Ficha del ejercicio (diseño aprobado del 2026-11-02, sin foto): nombre y pauta, la clave, el peso que toca hoy con su
 * porqué (doble progresión), cómo ha ido a lo largo del tiempo, qué músculos trabaja y su descanso. Desde la sesión,
 * «Empezar ejercicio» vuelve a ella con este ejercicio abierto. Con tu plan y tus entrenos.
 */
export function FichaEjercicioScreen(props: { exerciseId: string }) {
  const { query, route } = useLocation()
  usePlan()
  const [metrica, setMetrica] = useState<MetricaEjercicio>('maximo')
  const [eligiendo, setEligiendo] = useState(false)
  const [musculo, setMusculo] = useState<MuscleId | null>(null)
  const ex = ejercicioDeBiblioteca(props.exerciseId)
  const atras = () => (window.history.length > 1 ? window.history.back() : route(paths.training))
  if (!ex) {
    return (
      <Pending code="404" title="Este ejercicio no está en la biblioteca">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const f = fichaDe(ex)
  const musculos = (min: number, max: number) =>
    (Object.entries(ex.contributes) as [MuscleId, number][])
      .filter(([, c]) => c >= min && c < max)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
  const principales = musculos(1, Infinity)
  const secundarios = musculos(0.5, 1)
  const descanso = f.plan ? descansoDe(f.plan.e) : ex.restSec
  const cambiar = (s: number) => f.plan && elegirDescanso(f.plan.e.nombre, Math.min(600, Math.max(15, s)))

  const puntos = f.progreso.map((p) => ({ fecha: p.fecha, valor: p[metrica] }))
  const orden = avisoDeOrden(f.progreso)
  const puestoHoy = f.progreso.at(-1)?.puesto
  const ultimo = puntos.at(-1)
  const cambio = cambioDesdePrimera(puntos.map((p) => p.valor))
  const texto = (v: number) =>
    metrica === 'volumen'
      ? `${formatDecimal(Math.round(v / 100) / 10)} t`
      : `${formatDecimal(Math.round(v))} ${f.pesoCorporal ? 'reps' : 'kg'}`

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
        <span />
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
              etiqueta:
                f.rango[0] === f.rango[1]
                  ? `${f.rango[0]} repeticiones`
                  : `${f.rango[0]} a ${f.rango[1]} repeticiones`,
            },
            {
              icono: 'descanso',
              texto: formatClock(descanso),
              etiqueta: `Descanso ${formatClock(descanso)}`,
            },
          ]}
        />
        {ex.key && (
          <FichaClave texto={plainEffort(ex.key)} fuente={ex.deRutina ? ex.source : null} web={ex.keyWeb} />
        )}
        <FichaSugerencia
          etiqueta={f.sugerencia.etiqueta}
          valor={f.sugerencia.valor}
          porque={f.sugerencia.porque}
        />
        <SessionProgress
          metricas={f.pesoCorporal ? METRICAS.slice(0, 1) : METRICAS}
          etiqueta="Progreso del ejercicio"
          vacio="Aún no has hecho este ejercicio."
          valor={ultimo ? texto(ultimo.valor) : null}
          cambio={
            cambio === null ? null : `${formatChange(cambio)} desde la primera vez (${puntos.length} veces)`
          }
          fecha={ultimo ? formatDayDate(ultimo.fecha) : null}
          puntos={puntos}
          metrica={metrica}
          onMetrica={setMetrica}
          otroPuesto={f.progreso.map((p) => p.puesto !== puestoHoy)}
          aviso={
            orden &&
            `⚠ La última vez lo hiciste en el puesto ${orden.ahora} de la sesión y la anterior en el ${orden.antes}: con otra fatiga encima, la comparación no es exacta.`
          }
        />
        <FichaMusculos
          principales={principales.map((id) => ({ id, label: MUSCLES[id].label }))}
          secundarios={secundarios.map((id) => ({ id, label: MUSCLES[id].label }))}
          onMusculo={(id) => setMusculo(id as MuscleId)}
          series={Object.fromEntries([
            ...principales.map((id) => [id, 3]),
            ...secundarios.map((id) => [id, 1]),
          ])}
          names={NOMBRES}
        />
        {f.plan && (
          <FichaDescanso
            texto={formatClock(descanso)}
            onElegir={() => setEligiendo(true)}
            onMenos={() => cambiar(descanso - 15)}
            onMas={() => cambiar(descanso + 15)}
          />
        )}
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
      {musculo && <MusculoHoja musculo={musculo} onClose={() => setMusculo(null)} />}
      {eligiendo && f.plan && (
        <RestChoiceSheet
          nombre={ex.name}
          segundos={descanso}
          formato={formatClock}
          onElegir={(s) => {
            cambiar(s)
            setEligiendo(false)
          }}
          onClose={() => setEligiendo(false)}
        />
      )}
    </div>
  )
}
