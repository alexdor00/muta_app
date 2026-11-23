import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { ChevronLeftIcon } from '../../../../shared/ui/icons.tsx'
import ficha from '../ejercicio/FichaEjercicioScreen.module.css'
import { paths } from '../../../../shared/lib/paths.ts'
import { MuscleSheet } from '../../components/MuscleSheet.tsx'
import { elegirModo, nivelDelPlan, rangoMusculo, rangoPropio } from '../../state/musculos.ts'
import { sesiones } from '../../state/plan.ts'
import {
  barMax,
  muscleInPlan,
  MUSCLES,
  plainEffort,
  rangeFor,
  stepRange,
  verdict,
  type Mode,
  type MuscleId,
} from '../../state/routines.ts'
import { consejosDeMusculo, huecosDelPlan } from '../../use-cases/muscleSheet.ts'

const HOMBROS: MuscleId[] = ['hombro_ant', 'hombro_lat', 'hombro_post']
const MODOS: { id: Mode; label: string }[] = [
  { id: 'maintain', label: 'Mantener' },
  { id: 'develop', label: 'Desarrollar' },
  { id: 'priority', label: 'Prioridad' },
]

/**
 * La ficha de un músculo (A17–A21), a pantalla completa como la del ejercicio (`/entreno/musculo/pecho`, usuario, 2026-11-14): cuántas series le da tu plan por semana frente a su rango, el objetivo (Mantener,
 * Desarrollar, Prioridad o a mano), dónde lo entrenas (las sesiones de tu semana) y sus consejos. Añadir ejercicios
 * se hace en Editar rutina.
 */
export function MusculoScreen(props: { muscleId: string }) {
  const { route } = useLocation()
  const [musculo, setMusculo] = useState<MuscleId>(
    props.muscleId in MUSCLES ? (props.muscleId as MuscleId) : 'pecho',
  )
  const atras = () => (window.history.length > 1 ? window.history.back() : route(paths.training))
  const [pestana, setPestana] = useState<'resumen' | 'consejos'>('resumen')
  const { modo, rango, propio } = rangoMusculo(musculo)
  const plan = muscleInPlan(huecosDelPlan(sesiones.value), musculo)
  const consejos = consejosDeMusculo(musculo)
  const fila = (h: (typeof plan.directos)[number]) => ({ ...h, href: h.id ? paths.exercise(h.id) : null })
  return (
    <div class={ficha.page}>
      <header class={ficha.bar}>
        <button type="button" class={ficha.back} aria-label="Volver" onClick={atras}>
          <ChevronLeftIcon />
        </button>
        <h1 class={ficha.barTitle}>Ficha del músculo</h1>
        <span class={ficha.more} aria-hidden="true" />
      </header>
      <div class={ficha.cards}>
        <MuscleSheet
          titulo={MUSCLES[musculo].label}
          hermanos={
            HOMBROS.includes(musculo) ? HOMBROS.map((id) => ({ id, label: MUSCLES[id].label })) : null
          }
          musculo={musculo}
          onMusculo={setMusculo}
          series={plan.series}
          rango={rango}
          max={barMax(rango, plan.series)}
          veredicto={verdict(plan.series, rango)}
          pestana={pestana}
          onPestana={setPestana}
          modos={MODOS.map((m) => {
            const [a, b] = rangeFor(musculo, nivelDelPlan(), m.id)
            return { id: m.id, label: m.label, rango: `${a}–${b}`, on: !propio && m.id === modo }
          })}
          onModo={(id) => elegirModo(musculo, id as Mode)}
          propio={propio}
          onPaso={(cual, paso) => rangoPropio(musculo, stepRange(rango, cual, paso))}
          directos={plan.directos.map(fila)}
          indirectos={plan.indirectos.map(fila)}
          consejos={
            consejos && {
              clave: plainEffort(consejos.key),
              tips: consejos.tips.map((t) => ({ text: plainEffort(t.text), why: plainEffort(t.why) })),
              donde: consejos.where && plainEffort(consejos.where),
            }
          }
        />
      </div>
    </div>
  )
}
