import { useState } from 'preact/hooks'
import { formatChange, formatDayDate, formatTons } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PlayIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { ExerciseList } from '../../components/ExerciseList.tsx'
import { SessionHero } from '../../components/SessionHero.tsx'
import { SessionProgress, type Metrica } from '../../components/SessionProgress.tsx'
import { detalleSesion, progresoMuestra, sesionMuestra, tonoDe } from '../../state/muestra/datos.ts'
import { effortLabel } from '../../state/routines.ts'
import styles from './VerSesionScreen.module.css'

/**
 * Ver sesión (al tocar una tarjeta de Tu plan): cabecera con el color de la sesión, su progreso, sus ejercicios y
 * «Empezar» fijo abajo. Datos de prueba (state/muestra/).
 */
export function VerSesionScreen(props: { sessionId: string }) {
  const [metrica, setMetrica] = useState<Metrica>('ton')
  const [abierto, setAbierto] = useState<number | null>(null)
  const sesion = sesionMuestra(props.sessionId)
  if (!sesion) {
    return (
      <Pending code="404" title="Esta sesión no existe">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  const puntos = progresoMuestra(sesion.sigla).map((e) => ({
    fecha: e.fecha,
    valor: metrica === 'ton' ? e.toneladas : metrica === 'reps' ? e.reps : e.minutos,
  }))
  const ultimo = puntos.at(-1)
  const anterior = puntos.at(-2)
  const texto = (v: number) =>
    metrica === 'ton' ? formatTons(v) : `${v} ${metrica === 'reps' ? 'reps' : 'min'}`
  // El cambio frente a la vez anterior, redondeado: si redondea a 0 %, «Igual que la anterior»
  const pct = ultimo && anterior?.valor ? Math.round((ultimo.valor / anterior.valor - 1) * 100) : null
  const ejercicios = sesion.ejercicios.map((e) => ({
    nombre: e.nombre,
    detalle: `${e.series} series · ${e.reps} reps · ${effortLabel(e.rir)}`,
    ultima: e.ultima,
  }))
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
        <ExerciseList ejercicios={ejercicios} abierto={abierto} onAbrir={setAbierto} />
      </div>
      <div class={styles.footer}>
        <Button href={paths.sessionStart(sesion.sigla.toLowerCase())}>
          <span class={styles.startLabel}>
            <PlayIcon />
            Empezar {sesion.sigla}
          </span>
        </Button>
      </div>
    </div>
  )
}
