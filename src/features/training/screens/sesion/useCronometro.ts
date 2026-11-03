import { useEffect, useState } from 'preact/hooks'
import { formatClock } from '../../../../shared/lib/format.ts'
import type { ModoCronometro } from '../../components/SetTimer.tsx'
import { CADENCIAS, faseCadencia, type Cadencia } from '../../state/routines.ts'
import { avisar } from '../../use-cases/workoutFeedback.ts'

const DURACIONES = [20, 30, 45, 60, 90, 120] as const

type Estado = 'listo' | 'preparado' | 'marcha' | 'pausa'

/**
 * El cronómetro de una serie (C15–C17): cuenta 3-2-1, cronómetro, cadencia que cuenta repeticiones con un tono en cada
 * fase, o cuenta atrás que avisa al acabar. Al terminar llama a `onGuardar` con los segundos y, con cadencia, las reps.
 */
export function useCronometro(onGuardar: (r: { segundos: number; reps: number | null }) => void) {
  const [modo, setModo] = useState<ModoCronometro>('crono')
  const [cadencia, setCadencia] = useState<Cadencia>('3-0-1')
  const [duracion, setDuracion] = useState<number>(30)
  const [estado, setEstado] = useState<Estado>('listo')
  const [desde, setDesde] = useState(0)
  const [pausa, setPausa] = useState({ ms: 0, en: 0 })
  const [ahora, setAhora] = useState(0)
  const [ultimaFase, setUltimaFase] = useState('')

  useEffect(() => {
    if (estado === 'listo') return
    const reloj = setInterval(() => setAhora(Date.now()), 100)
    return () => clearInterval(reloj)
  }, [estado])

  const cuenta = estado === 'preparado' ? 3 - Math.floor((ahora - desde) / 1000) : 0
  const segundos =
    estado === 'marcha' || estado === 'pausa'
      ? Math.max(0, ((estado === 'pausa' ? pausa.en : ahora) - desde - pausa.ms) / 1000)
      : 0
  const fase = modo === 'cadencia' ? faseCadencia(segundos, cadencia) : null

  function reiniciar() {
    setEstado('listo')
    setPausa({ ms: 0, en: 0 })
    setUltimaFase('')
  }

  function terminar(s = segundos) {
    onGuardar({ segundos: Math.round(s), reps: fase && fase.reps > 0 ? fase.reps : null })
    reiniciar()
  }

  // Tonos: cada segundo de la cuenta 3-2-1, cada fase de la cadencia y el final de la cuenta atrás (en cada repintado:
  // el reloj repinta diez veces por segundo mientras corre)
  useEffect(() => {
    if (estado === 'preparado') {
      if (cuenta <= 0) {
        avisar('betterThanLast')
        setEstado('marcha')
        setDesde(Date.now())
      } else if (ultimaFase !== `c${cuenta}`) {
        avisar('setLogged')
        setUltimaFase(`c${cuenta}`)
      }
    }
    if (estado !== 'marcha') return
    if (fase && ultimaFase !== `${fase.reps}${fase.fase}`) {
      avisar('setLogged')
      setUltimaFase(`${fase.reps}${fase.fase}`)
    }
    if (modo === 'cuenta' && segundos >= duracion) {
      avisar('restEnd')
      onGuardar({ segundos: duracion, reps: null })
      setEstado('listo')
      setPausa({ ms: 0, en: 0 })
      setUltimaFase('')
    }
  }, [estado, fase, ultimaFase, modo, segundos, duracion, cuenta, onGuardar])

  const quedan = Math.max(0, duracion - segundos)
  return {
    modo,
    onModo: setModo,
    cadencias: CADENCIAS,
    cadencia,
    onCadencia: (c: string) => setCadencia(CADENCIAS.find((x) => x === c) ?? '3-0-1'),
    duraciones: DURACIONES,
    duracion,
    onDuracion: setDuracion,
    estado,
    rotulo:
      estado === 'listo'
        ? modo === 'cadencia'
          ? `Cadencia ${cadencia}`
          : modo === 'cuenta'
            ? 'Aguanta'
            : 'Listo'
        : estado === 'preparado'
          ? 'Prepárate'
          : (fase?.fase ?? (modo === 'cuenta' ? 'Aguanta' : 'En marcha')),
    grande:
      estado === 'preparado'
        ? String(Math.max(1, cuenta))
        : formatClock(modo === 'cuenta' ? Math.ceil(estado === 'listo' ? duracion : quedan) : segundos),
    reps: modo === 'cadencia' ? (fase?.reps ?? 0) : null,
    avance: modo === 'cuenta' ? quedan / duracion : fase ? fase.avance : (segundos % 60) / 60,
    formato: formatClock,
    onEmpezar: () => {
      setDesde(Date.now())
      setAhora(Date.now())
      setEstado('preparado')
    },
    onPausa: () => {
      if (estado === 'marcha') {
        setPausa({ ...pausa, en: Date.now() })
        setEstado('pausa')
      } else if (estado === 'pausa') {
        setPausa({ ms: pausa.ms + (Date.now() - pausa.en), en: 0 })
        setEstado('marcha')
      }
    },
    onTerminar: () => (estado === 'preparado' ? reiniciar() : terminar()),
    reiniciar,
  }
}
