import { formatClock } from '../../../../shared/lib/format.ts'
import {
  DangerSheet,
  RestChoiceSheet,
  SessionSheet,
  SessionTimeSheet,
} from '../../components/WorkoutSheets.tsx'
import type { EjercicioMuestra, SesionMuestra } from '../../state/muestra/datos.ts'
import { desdeBiblioteca } from '../../state/muestra/ejercicios.ts'
import {
  alternarPausa,
  anadirEjercicio,
  contarDesdeAhora,
  cuentaSeries,
  elegirDescanso,
  guardarSesion,
  segundosSesion,
  type SesionEnCurso,
} from '../../state/muestra/sesionEnCurso.ts'
import type { SessionTip } from '../../state/routines.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { HojaConsejos } from './HojaConsejos.tsx'

export type HojaSesion =
  | { tipo: 'sesion' }
  | { tipo: 'tiempo' }
  | { tipo: 'cambiar' }
  | { tipo: 'descartar' }
  | { tipo: 'anadir' }
  | { tipo: 'consejos' }
  | { tipo: 'descanso'; ejercicio: EjercicioMuestra; segundos: number }

type Props = {
  hoja: HojaSesion
  onHoja: (hoja: HojaSesion | null) => void
  sesion: SesionMuestra
  en: SesionEnCurso
  /** «Para esta sesión», con el orden de hoy. */
  consejos: SessionTip[]
  ahora: number
  /** Cambiar de sesión o descartarla: se borra lo apuntado y se vuelve a Tu plan. */
  onSalir: () => void
  onAviso: (texto: string) => void
  /** Se añadió un ejercicio (C19): su número, para abrirlo. */
  onAnadido: (indice: number) => void
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
  if (hoja.tipo === 'anadir') {
    return (
      <BibliotecaHoja
        onElegir={(ex) => {
          guardarSesion(anadirEjercicio(en, desdeBiblioteca(ex)))
          props.onAviso(`${ex.name} añadido, solo para hoy`)
          props.onAnadido(en.ejercicios.length)
          cerrar()
        }}
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
      onAnadir={() => onHoja({ tipo: 'anadir' })}
      onDescartar={() => onHoja({ tipo: 'descartar' })}
      onClose={cerrar}
    />
  )
}
