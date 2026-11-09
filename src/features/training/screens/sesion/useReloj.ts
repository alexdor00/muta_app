import { useEffect, useState } from 'preact/hooks'
import { formatClock } from '../../../../shared/lib/format.ts'
import { avisar, pantallaEncendida } from '../../use-cases/workoutFeedback.ts'

/**
 * El reloj de la sesión: la hora cada 250 ms (con la pantalla encendida mientras dura) y el descanso entre series, que al
 * llegar a cero suena y vibra y, 90 s después de pasarse, se quita solo. A 15 s del final vibra suave para que te prepares
 * (guía G1: mentalízate antes de cada serie).
 */
/** Segundos antes del final del descanso en los que se avisa para prepararse. */
export const PREPARATE = 15

export function useReloj() {
  const [ahora, setAhora] = useState(() => Date.now())
  const [descanso, setDescanso] = useState<{ fin: number; avisado: boolean; preparado?: boolean } | null>(
    null,
  )

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
      if (!d) return d
      const quedan = (d.fin - ahora) / 1000
      if (quedan < -90) return null
      if (quedan > 0 && quedan <= PREPARATE && !d.preparado) {
        avisar('restSoon')
        return { ...d, preparado: true }
      }
      if (quedan > 0 || d.avisado) return d
      avisar('restEnd')
      return { ...d, avisado: true }
    })
  }, [ahora])

  const quedanDescanso = descanso ? (descanso.fin - ahora) / 1000 : 0
  const tiempoDescanso =
    quedanDescanso > 0 ? formatClock(Math.ceil(quedanDescanso)) : `+${formatClock(-quedanDescanso)}`
  return { ahora, descanso, setDescanso, quedanDescanso, tiempoDescanso }
}
