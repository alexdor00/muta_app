import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { SetTimer } from '../../components/SetTimer.tsx'
import { PlatesSheet } from '../../components/PlatesSheet.tsx'
import { ExerciseOptionsSheet, NoteSheet, SwapSheet } from '../../components/WorkoutSheets.tsx'
import type { EjercicioPlan } from '../../state/plan.ts'
import { hacerAhora } from '../../state/ordenHoy.ts'
import {
  grises,
  guardarSesion,
  type EjercicioEnCurso,
  type SesionEnCurso,
} from '../../state/sesionEnCurso.ts'
import { discosPorLado } from '../../state/routines.ts'
import { idPorNombre } from '../../use-cases/exerciseLibrary.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { useCronometro } from './useCronometro.ts'

type Hoja = 'opciones' | 'cambiar' | 'biblioteca' | 'nota' | 'discos' | 'cronometro'
type Barra = '20' | '15' | '10' | '0'

type Props = {
  e: EjercicioPlan
  x: EjercicioEnCurso
  nombre: string
  /** La sesión y el ejercicio, para que su ficha pueda volver con él abierto. */
  desde: { sesion: string; ejercicio: number }
  /** La sesión en curso, para «Hacer ahora» (cambia el orden solo hoy). */
  en: SesionEnCurso
  onAviso: (texto: string) => void
  /** Abre un ejercicio (tras «Hacer ahora»). */
  onAbrir: (ej: number) => void
  onCambiar: (nombre: string) => void
  onNota: (nota: string) => void
  /** El cronómetro terminó la serie `serie`: su tiempo y, con cadencia, las reps contadas. */
  onCronometro: (serie: number, r: { segundos: number; reps: number | null }) => void
  onCerrar: () => void
}

/**
 * Lo que abre «···» de un ejercicio (C11) y sus hojas: hacerlo ahora, cambiarlo hoy (C12), nota (C13), discos (C14) y
 * cronómetro.
 */
export function HojasEjercicio(props: Props) {
  const { e, x, nombre, desde, onCambiar, onNota, onCronometro, onCerrar } = props
  const adelantada = hacerAhora(props.en, desde.ejercicio)
  const ahora =
    adelantada.orden.join() === props.en.orden.join()
      ? null
      : () => {
          guardarSesion(adelantada)
          props.onAviso(`${nombre} pasa a ser el siguiente, solo hoy`)
          onCerrar()
          props.onAbrir(desde.ejercicio)
        }
  const [hoja, setHoja] = useState<Hoja>('opciones')
  // La serie que toca: la primera sin hacer (o la última)
  const serie = Math.max(
    0,
    x.series.findIndex((s) => !s.hecha),
  )
  const kilos = x.series[serie]?.kg || grises(e, x, serie).kg
  const [total, setTotal] = useState(kilos)
  const [barra, setBarra] = useState<Barra>('20')
  const cronometro = useCronometro((r) => {
    onCronometro(serie, r)
    onCerrar()
  })

  if (hoja === 'cambiar') {
    return (
      <SwapSheet
        sustitutos={e.sustitutos}
        onElegir={onCambiar}
        onBiblioteca={() => setHoja('biblioteca')}
        onClose={onCerrar}
      />
    )
  }
  if (hoja === 'biblioteca') {
    return <BibliotecaHoja musculo={e.musculo} onElegir={(ex) => onCambiar(ex.name)} onClose={onCerrar} />
  }
  if (hoja === 'nota') return <NoteSheet nota={x.nota} onGuardar={onNota} onClose={onCerrar} />
  if (hoja === 'discos') {
    const { discos, sobra } = discosPorLado(parseDecimal(total) ?? 0, Number(barra))
    return (
      <PlatesSheet
        total={total}
        onTotal={setTotal}
        barra={barra}
        onBarra={setBarra}
        discos={discos}
        porLado={discos.map(formatDecimal).join(' + ')}
        sobra={sobra > 0 ? formatDecimal(sobra) : null}
        onClose={onCerrar}
      />
    )
  }
  if (hoja === 'cronometro') {
    return (
      <SetTimer
        {...cronometro}
        serie={`Serie ${serie + 1} de ${x.series.length}`}
        nombre={nombre}
        onCerrar={() => {
          cronometro.reiniciar()
          onCerrar()
        }}
      />
    )
  }
  return (
    <ExerciseOptionsSheet
      nombre={nombre}
      fichaHref={paths.exercise(idPorNombre(nombre) ?? encodeURIComponent(nombre), desde)}
      nota={x.nota}
      onAhora={ahora}
      onCambiar={() => setHoja('cambiar')}
      onNota={() => setHoja('nota')}
      onDiscos={() => setHoja('discos')}
      onCronometro={() => setHoja('cronometro')}
      onClose={onCerrar}
    />
  )
}
