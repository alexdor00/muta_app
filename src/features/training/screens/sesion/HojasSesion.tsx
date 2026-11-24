import { formatClock, formatLongDate, localDate } from '../../../../shared/lib/format.ts'
import {
  DangerSheet,
  RestChoiceSheet,
  SessionSheet,
  SessionTimeSheet,
} from '../../components/WorkoutSheets.tsx'
import type { EjercicioPlan, SesionPlan } from '../../state/plan.ts'
import { cuentaSeries, elegirDescanso, guardarSesion, type SesionEnCurso } from '../../state/sesionEnCurso.ts'
import { alternarPausa, contarDesdeAhora, segundosSesion } from '../../state/tiempoSesion.ts'
import type { SessionTip } from '../../state/routines.ts'
import { HojaConsejos } from './HojaConsejos.tsx'

export type HojaSesion =
  | { tipo: 'sesion' }
  | { tipo: 'tiempo' }
  | { tipo: 'cambiar' }
  | { tipo: 'descartar' }
  | { tipo: 'consejos' }
  | { tipo: 'otroDia' }
  | { tipo: 'descanso'; ejercicio: EjercicioPlan; segundos: number }

/**
 * La hoja que se abre al entrar en la sesión: si es de otro día y sin terminar, preguntar qué hacer (usuario, 2026-11-23);
 * si no, los consejos con «Mostrar al empezar» mientras no hay ninguna serie hecha.
 */
export function hojaAlEntrar(en: SesionEnCurso | null, consejosAlEmpezar: boolean): HojaSesion | null {
  if (en && !en.terminada && localDate(new Date(en.inicio)) !== localDate()) return { tipo: 'otroDia' }
  return consejosAlEmpezar && !(en && cuentaSeries(en).hechas) ? { tipo: 'consejos' } : null
}

type Props = {
  hoja: HojaSesion
  onHoja: (hoja: HojaSesion | null) => void
  sesion: SesionPlan
  en: SesionEnCurso
  /** «Para esta sesión», con el orden de hoy. */
  consejos: SessionTip[]
  ahora: number
  /** Cambiar de sesión o descartarla: se borra lo apuntado y se vuelve a Tu plan. */
  onSalir: () => void
  onAviso: (texto: string) => void
  /** La sesión es de otro día y la guardas como estaba (acaba con tu última serie). */
  onGuardarComoEstaba: () => void
  /** Se añadió un ejercicio (C19): su número, para abrirlo. */
}

/**
 * Las hojas de la sesión en curso: «Esta sesión» (C08), Tiempo (C09), descanso de un ejercicio (C18), cambiar de
 * sesión (C20), descartarla (C21), añadir un ejercicio de la biblioteca (C19) y los consejos de hoy (C10).
 */
export function HojasSesion(props: Props) {
  const { hoja, onHoja, en, ahora } = props
  const cerrar = () => onHoja(null)
  // Series apuntadas: si hay, cambiar de sesión las borra y se pregunta antes
  const { hechas } = cuentaSeries(en)
  if (hoja.tipo === 'tiempo') {
    return (
      <SessionTimeSheet
        tiempo={formatClock(segundosSesion(en, ahora))}
        pausada={en.pausadaEn !== null}
        onPausa={() => {
          guardarSesion(alternarPausa(en, ahora))
          cerrar()
        }}
        onDesdeAhora={() => {
          guardarSesion(contarDesdeAhora(en, ahora))
          cerrar()
        }}
        onClose={cerrar}
      />
    )
  }
  if (hoja.tipo === 'cambiar') {
    return (
      <DangerSheet
        titulo="¿Cambiar de sesión?"
        texto={
          hechas === 1
            ? 'Se borra la serie que apuntaste en esta.'
            : `Se borran las ${hechas} series que apuntaste en esta.`
        }
        accion="Cambiar"
        onSi={props.onSalir}
        onClose={cerrar}
      />
    )
  }
  if (hoja.tipo === 'descartar') {
    return (
      <DangerSheet
        titulo="¿Descartar la sesión?"
        texto="Se borra lo apuntado hoy y la rotación no avanza."
        accion="Descartar"
        onSi={props.onSalir}
        onClose={cerrar}
      />
    )
  }
  // Vuelves a una sesión empezada otro día (usuario, 2026-11-23): sigues con ella o se guarda como estaba
  if (hoja.tipo === 'otroDia') {
    return (
      <DangerSheet
        titulo={`Empezaste esta sesión el ${formatLongDate(localDate(new Date(en.inicio))).toLowerCase()}`}
        texto="Si la guardas, queda en ese día con lo que apuntaste y acaba con tu última serie."
        accion="Guardarla como estaba"
        cancelar="Seguir con ella"
        normal
        onSi={props.onGuardarComoEstaba}
        onClose={cerrar}
      />
    )
  }
  if (hoja.tipo === 'consejos') {
    return (
      <HojaConsejos
        sesion={props.sesion}
        en={en}
        consejos={props.consejos}
        onAviso={props.onAviso}
        onClose={cerrar}
      />
    )
  }
  if (hoja.tipo === 'descanso') {
    return (
      <RestChoiceSheet
        nombre={hoja.ejercicio.nombre}
        segundos={hoja.segundos}
        formato={formatClock}
        onElegir={(s) => {
          elegirDescanso(hoja.ejercicio.nombre, s)
          props.onAviso(`Descanso de ${hoja.ejercicio.nombre}: ${formatClock(s)}`)
          cerrar()
        }}
        onClose={cerrar}
      />
    )
  }
  return (
    <SessionSheet
      onTiempo={() => onHoja({ tipo: 'tiempo' })}
      // Sin series apuntadas no se pierde nada: se cambia sin preguntar
      onCambiar={() => (hechas ? onHoja({ tipo: 'cambiar' }) : props.onSalir())}
      onConsejos={() => onHoja({ tipo: 'consejos' })}
      onDescartar={() => onHoja({ tipo: 'descartar' })}
      onClose={cerrar}
    />
  )
}
