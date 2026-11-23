import { useEffect, useState } from 'preact/hooks'
import { formatClock } from '../../../../shared/lib/format.ts'
import { avisar, pantallaEncendida } from '../../use-cases/workoutFeedback.ts'

/**
 * El reloj de la sesión: la hora cada 250 ms (con la pantalla encendida mientras dura) y el descanso entre series, que al
 * llegar a cero suena y vibra y, 90 s después de pasarse, se quita solo.
 */
export function useReloj() {
  const [ahora, setAhora] = useState(() => Date.now())
  const [descanso, setDescanso] = useState<{
    fin: number
    dura: number
    avisado: boolean
    /** Parado: los segundos que quedaban al pararlo (usuario, 2026-11-14: todos los cronómetros se paran). */
    parado?: number | null
  } | null>(null)

  useEffect(() => {
    pantallaEncendida(true)
    const reloj = setInterval(() => setAhora(Date.now()), 250)
    return () => {
      clearInterval(reloj)
      pantallaEncendida(false)
    }
  }, [])

  useEffect(() => {
    setDescanso((d) => {
      if (!d || d.parado != null) return d
      const quedan = (d.fin - ahora) / 1000
      if (quedan < -90) return null
      if (quedan > 0 || d.avisado) return d
      avisar('restEnd')
      return { ...d, avisado: true }
    })
  }, [ahora])

  const quedanDescanso = descanso ? (descanso.parado ?? (descanso.fin - ahora) / 1000) : 0
  /** Para el descanso o lo sigue desde donde se quedó. */
  const pausarDescanso = () =>
    setDescanso((d) =>
      !d
        ? d
        : d.parado != null
          ? { ...d, fin: Date.now() + d.parado * 1000, parado: null }
          : { ...d, parado: (d.fin - Date.now()) / 1000 },
    )
  const tiempoDescanso =
    quedanDescanso > 0 ? formatClock(Math.ceil(quedanDescanso)) : `+${formatClock(-quedanDescanso)}`
  // Lo que queda del descanso, de 1 a 0 (el anillo de la tarjeta del descanso)
  const parteDescanso = descanso?.dura ? Math.min(1, Math.max(0, quedanDescanso / descanso.dura)) : 0
  const descansoParado = descanso?.parado != null
  return {
    ahora,
    descanso,
    setDescanso,
    quedanDescanso,
    tiempoDescanso,
    parteDescanso,
    pausarDescanso,
    descansoParado,
  }
}
