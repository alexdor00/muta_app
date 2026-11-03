import { useEffect, useRef, useState } from 'preact/hooks'
import { formatDecimal } from '../../../../shared/lib/format.ts'
import type { CampoSerie } from '../../components/WorkoutExercise.tsx'
import type { Tecla } from '../../components/WorkoutKeypad.tsx'
import type { SesionMuestra } from '../../state/muestra/datos.ts'
import {
  ejerciciosDe,
  grises,
  guardarSesion,
  nombreHoy,
  type SesionEnCurso,
} from '../../state/muestra/sesionEnCurso.ts'
import { teclear } from '../../state/routines.ts'

export type Casilla = { ej: number; serie: number; campo: CampoSerie }

const NOMBRE_CAMPO: Record<CampoSerie, string> = {
  kg: 'peso en kg',
  reps: 'repeticiones',
  quedan: 'las que quedaban al fallo',
}
const ETIQUETA_CAMPO: Record<CampoSerie, string> = {
  kg: 'Kilos de la serie',
  reps: 'Repeticiones de la serie',
  quedan: 'Repeticiones que quedaban al fallo en la serie',
}
const ORDEN: CampoSerie[] = ['kg', 'reps', 'quedan']

/**
 * El teclado propio de la sesión (C02): qué casilla se escribe, qué hace cada tecla, › a la casilla siguiente sin hacer,
 * y tocar fuera lo cierra. La casilla que se escribe sube por encima del teclado.
 */
export function useTeclado(sesion: SesionMuestra | null, en: SesionEnCurso | null) {
  const [activa, setActiva] = useState<Casilla | null>(null)
  // La primera tecla tras entrar en una casilla sustituye lo que hay; las siguientes escriben detrás
  const [fresca, setFresca] = useState(true)
  const teclado = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activa) return
    document
      .querySelector(`[aria-label="${ETIQUETA_CAMPO[activa.campo]} ${activa.serie + 1}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const fuera = (event: PointerEvent) => {
      const t = event.target
      if (!(t instanceof Element) || teclado.current?.contains(t) || t.closest('input')) return
      if (t.closest('button[aria-pressed]')) return
      setActiva(null)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [activa])

  /** Entra en una casilla (o cierra el teclado con null). */
  const entrar = (casilla: Casilla | null) => {
    setActiva(casilla)
    setFresca(true)
  }

  function tecla(t: Tecla) {
    if (!activa || !en || !sesion) return
    const { ej, serie, campo } = activa
    const x = en.ejercicios[ej]
    const e = ejerciciosDe(sesion, en)[ej]
    const r = teclear(
      { campo, valor: x.series[serie][campo], gris: grises(e, x, serie)[campo], fresca, salto: e.salto },
      t,
    )
    if (!r) return
    setFresca(r.fresca)
    const series = x.series.map((s, k) => (k === serie ? { ...s, [campo]: r.valor } : s))
    guardarSesion({ ...en, ejercicios: en.ejercicios.map((y, i) => (i === ej ? { ...y, series } : y)) })
  }

  /** ›: la casilla siguiente sin hacer (kilos → reps → quedan → kilos de la serie siguiente). */
  function siguiente() {
    if (!activa || !en) return
    const { ej, serie, campo } = activa
    const k = ORDEN.indexOf(campo)
    if (k < 2) return entrar({ ej, serie, campo: ORDEN[k + 1] })
    const otra = en.ejercicios[ej].series.findIndex((s, i) => i > serie && !s.hecha)
    entrar(otra >= 0 ? { ej, serie: otra, campo: 'kg' } : null)
  }

  const e = activa && sesion && en ? ejerciciosDe(sesion, en)[activa.ej] : null
  const vista =
    activa && e && en
      ? {
          titulo: nombreHoy(e, en.ejercicios[activa.ej]),
          detalle: `Serie ${activa.serie + 1} · ${NOMBRE_CAMPO[activa.campo]}`,
          paso: activa.campo === 'kg' ? formatDecimal(e.salto) : '1',
        }
      : null
  return { activa, entrar, tecla, siguiente, teclado, vista }
}
