import { useState } from 'preact/hooks'
import { formatChange, formatDayDate, formatTons } from '../lib/format.ts'
import { SessionProgress } from './SessionProgress.tsx'

/** Lo que enseña la gráfica de una sesión. */
const METRICAS_SESION = [
  { value: 'ton', label: 'Tonelaje' },
  { value: 'reps', label: 'Repeticiones' },
  { value: 'min', label: 'Duración' },
] as const
type Metrica = (typeof METRICAS_SESION)[number]['value']

/** Una vez que hiciste la sesión: lo que moviste, cuántas repeticiones y cuánto duró. */
export type VezDeSesion = { fecha: string; toneladas: number; reps: number; minutos: number }

/**
 * La gráfica de una sesión, igual en Ver sesión y en un día de Progreso: Tonelaje · Repeticiones · Duración, la última
 * vez con su cambio frente a la anterior («Igual que la anterior» si redondea a 0 %). `veces`, de más antigua a más
 * reciente: en un día de Progreso, hasta ese día.
 */
export function SessionChart({ veces, etiqueta }: { veces: readonly VezDeSesion[]; etiqueta: string }) {
  const [metrica, setMetrica] = useState<Metrica>('ton')
  const puntos = veces.map((e) => ({
    fecha: e.fecha,
    valor: metrica === 'ton' ? e.toneladas : metrica === 'reps' ? e.reps : e.minutos,
  }))
  const ultimo = puntos.at(-1)
  const anterior = puntos.at(-2)
  const texto = (v: number) =>
    metrica === 'ton' ? formatTons(v) : `${v} ${metrica === 'reps' ? 'reps' : 'min'}`
  const pct = ultimo && anterior?.valor ? Math.round((ultimo.valor / anterior.valor - 1) * 100) : null
  return (
    <SessionProgress
      metricas={METRICAS_SESION}
      etiqueta={etiqueta}
      vacio="Aún no has hecho esta sesión."
      valor={ultimo ? texto(ultimo.valor) : null}
      texto={texto}
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
  )
}
