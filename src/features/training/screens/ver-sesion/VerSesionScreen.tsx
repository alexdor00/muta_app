import { useState } from 'preact/hooks'
import { formatChange, formatDayDate, formatDecimal, formatTons } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PlayIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { ExerciseList } from '../../components/ExerciseList.tsx'
import { SessionHero } from '../../components/SessionHero.tsx'
import { METRICAS_SESION, SessionProgress, type Metrica } from '../../components/SessionProgress.tsx'
import { SessionTipsCard } from '../../components/SessionTips.tsx'
import {
  cambioDe,
  detalleSesion,
  entrenos,
  notaSugerido,
  progresoDeSesion,
  sesionDe,
  tonoDe,
} from '../../state/plan.ts'
import { effortLabel } from '../../state/routines.ts'
import { consejosDeSesion } from '../../use-cases/sessionTips.ts'
import { porNombre } from '../../use-cases/exerciseLibrary.ts'
import { SinPlan } from '../comun/SinPlan.tsx'
import { usePlan } from '../comun/usePlan.ts'
import styles from './VerSesionScreen.module.css'

/** El cambio para enseñarlo: «2,4 %» con un decimal y si sube, baja o se queda igual (redondeado a 0,1 %). */
function vistaCambio(c: number | null): { texto: string; sentido: 1 | 0 | -1 } | null {
  if (c === null) return null
  const sentido = Math.round(c * 1000) === 0 ? 0 : c > 0 ? 1 : -1
  return { texto: formatChange(Math.abs(c), 1).replace(/^[+−]/, ''), sentido }
}

/**
 * Ver sesión (al tocar una tarjeta de Tu plan): cabecera con el color de la sesión, su progreso, los consejos para esta
 * sesión (si hay), sus ejercicios con la última vez y «Empezar» fijo abajo.
 */
export function VerSesionScreen(props: { sessionId: string }) {
  const [metrica, setMetrica] = useState<Metrica>('ton')
  const [abierto, setAbierto] = useState<number | null>(null)
  const plan = usePlan()
  if (plan.status === 'loading') return null
  if (plan.status === 'none') return <SinPlan />
  const sesion = sesionDe(props.sessionId)
  if (!sesion) {
    return (
      <Pending code="404" title="Esta sesión no existe">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const puntos = progresoDeSesion(entrenos.value, sesion.sigla).map((e) => ({
    fecha: e.fecha,
    valor: metrica === 'ton' ? e.toneladas : metrica === 'reps' ? e.reps : e.minutos,
  }))
  const ultimo = puntos.at(-1)
  const anterior = puntos.at(-2)
  const texto = (v: number) =>
    metrica === 'ton' ? formatTons(v) : `${v} ${metrica === 'reps' ? 'reps' : 'min'}`
  // El cambio frente a la vez anterior, redondeado: si redondea a 0 %, «Igual que la anterior»
  const pct = ultimo && anterior?.valor ? Math.round((ultimo.valor / anterior.valor - 1) * 100) : null
  const ejercicios = sesion.ejercicios.map((e) => {
    const lib = porNombre(e.nombre)
    return {
      nombre: e.nombre,
      detalle: `${e.series} series · ${e.reps} reps · ${effortLabel(e.rir)}`,
      sugerido:
        [e.enLugarDe ? 'En lugar de ' + e.enLugarDe + ' (cambiado en tu plan)' : null, notaSugerido(e)]
          .filter(Boolean)
          .join(' · ') || null,
      href: lib ? paths.exercise(lib.id) : null,
      cambio: vistaCambio(cambioDe(e)),
      ultima: e.ultima.map((u) => (u.kg != null ? `${formatDecimal(u.kg)} × ${u.reps}` : `${u.reps} reps`)),
    }
  })
  const comparados = ejercicios.flatMap((e) => (e.cambio ? [e.cambio] : []))
  return (
    <div class={styles.page}>
      <SessionHero
        sigla={sesion.sigla}
        nombre={sesion.nombre}
        detalle={detalleSesion(sesion)}
        tono={tonoDe(sesion.sigla)}
        backHref={paths.training}
      />
      <div class={styles.panel}>
        <SessionProgress
          metricas={METRICAS_SESION}
          etiqueta="Progreso de la sesión"
          vacio="Aún no has hecho esta sesión."
          valor={ultimo ? texto(ultimo.valor) : null}
          cambio={
            pct === null
              ? null
              : pct === 0
                ? 'Igual que la anterior'
                : `${formatChange(pct / 100)} que la anterior`
          }
          fecha={ultimo ? formatDayDate(ultimo.fecha) : null}
          puntos={puntos}
          metrica={metrica}
          onMetrica={setMetrica}
        />
        <SessionTipsCard
          consejos={consejosDeSesion(sesion.ejercicios).map((t) => ({ text: t.text, why: t.why }))}
        />
        <ExerciseList
          ejercicios={ejercicios}
          abierto={abierto}
          onAbrir={setAbierto}
          suben={
            comparados.length
              ? `${comparados.filter((c) => c.sentido > 0).length} de ${comparados.length} suben`
              : null
          }
        />
      </div>
      <div class={styles.footer}>
        <Button href={paths.session(sesion.sigla.toLowerCase())}>
          <span class={styles.startLabel}>
            <PlayIcon />
            Empezar {sesion.sigla}
          </span>
        </Button>
      </div>
    </div>
  )
}
