import { TodayTipsSheet } from '../../components/SessionTips.tsx'
import { detalleSesion, type SesionPlan } from '../../state/plan.ts'
import {
  alternarConsejosAlEmpezar,
  consejosAlEmpezar,
  hacerAhora,
  invertir,
  marcarConsejo,
} from '../../state/ordenHoy.ts'
import { guardarSesion, type SesionEnCurso } from '../../state/sesionEnCurso.ts'
import type { SessionTip } from '../../state/routines.ts'
import { CONSEJOS_ANTES } from '../../use-cases/sessionTips.ts'

const ETIQUETA = { invertir: 'Invertir hoy', subir: 'Subirlo hoy' } as const

/**
 * «Consejos de hoy» (C10) en la sesión: los de esta sesión (los que se arreglan con un toque cambian el orden solo hoy)
 * y «Antes de la primera serie», con lo marcado guardado en la sesión.
 */
export function HojaConsejos(props: {
  sesion: SesionPlan
  en: SesionEnCurso
  consejos: SessionTip[]
  onAviso: (texto: string) => void
  onClose: () => void
}) {
  const { sesion, en } = props
  const aplicar = (t: SessionTip) => {
    const a = t.accion
    if (!a) return
    const nueva = a.tipo === 'invertir' ? invertir(en, a.a, a.b) : hacerAhora(en, en.orden[a.indice])
    guardarSesion({ ...nueva, aplicados: [...en.aplicados, t.id] })
    props.onAviso('Orden cambiado, solo para hoy')
  }
  return (
    <TodayTipsSheet
      sigla={sesion.sigla}
      nombre={sesion.nombre}
      detalle={detalleSesion(sesion).replace(/ · \d+ min$/, '')}
      consejos={props.consejos.map((t) => ({
        text: t.text,
        why: t.why,
        accion: t.accion && {
          label: ETIQUETA[t.accion.tipo],
          hecho: en.aplicados.includes(t.id),
          onClick: () => aplicar(t),
        },
      }))}
      antes={CONSEJOS_ANTES.map((c, k) => ({ text: c.text, why: c.why, hecho: Boolean(en.marcados[k]) }))}
      onMarcar={(k) => guardarSesion(marcarConsejo(en, k))}
      alEmpezar={consejosAlEmpezar.value}
      onAlEmpezar={alternarConsejosAlEmpezar}
      onClose={props.onClose}
    />
  )
}
