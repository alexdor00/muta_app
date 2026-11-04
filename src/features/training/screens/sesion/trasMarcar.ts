import { avisar } from '../../use-cases/workoutFeedback.ts'
import { DESCANSO_SUPERSERIE, siguienteEnSuperserie } from '../../state/seriesEspeciales.ts'
import {
  ejerciciosDe,
  guardarSesion,
  nombreHoy,
  sesionEnCurso,
  terminado,
  type Apunte,
} from '../../state/sesionEnCurso.ts'
import { siguienteSinTerminar } from '../../state/ordenHoy.ts'
import { irASerie } from './desplazar.ts'

type Hecha = Extract<Apunte, { tipo: 'hecha' }>
type Campo = 'kg' | 'reps' | 'quedan'

/** Lo que la pantalla de la sesión le da para seguir tras marcar una serie. */
type Pantalla = {
  ahora: number
  /** ¿Está abierto el teclado? */
  activa: boolean
  setDescanso: (d: { fin: number; avisado: boolean } | null) => void
  entrar: (a: { ej: number; serie: number; campo: Campo } | null) => void
  decir: (texto: string) => void
  abrir: (ej: number) => void
  setAbierto: (ej: number) => void
}

/**
 * Tras marcar una serie (ya apuntada): se guarda, suena, empieza el descanso y se sigue. En superserie, al otro ejercicio
 * (con 20 s entre los dos, o el descanso normal tras el último); si no, a la serie siguiente o, terminado el ejercicio, al
 * siguiente que falte.
 */
export function trasMarcar(apunte: Hecha, ej: number, j: number, p: Pantalla): void {
  guardarSesion(apunte.sesion)
  const c = apunte.comparacion
  avisar(c === 1 ? 'record' : c === 0 ? 'betterThanLast' : 'setLogged')
  p.setDescanso(apunte.descanso === null ? null : { fin: p.ahora + apunte.descanso * 1000, avisado: false })
  const ss = siguienteEnSuperserie(apunte.sesion, ej)
  if (ss) {
    if (ss.corto) p.setDescanso({ fin: p.ahora + DESCANSO_SUPERSERIE * 1000, avisado: false })
    p.entrar(null)
    const otro = ejerciciosDe(apunte.sesion)[ss.siguiente]
    p.decir(`Superserie: ahora ${nombreHoy(otro, apunte.sesion.ejercicios[ss.siguiente])}`)
    setTimeout(() => p.abrir(ss.siguiente), 300)
    return
  }
  if (apunte.bajada)
    p.decir(`Bajaste de ${apunte.bajada.de} a ${apunte.bajada.a} reps. Descansa 1 minuto más.`)
  // Con el teclado abierto sigue en los kilos de la serie siguiente
  if (p.activa) {
    const mas = j + 1 < apunte.sesion.ejercicios[ej].series.length
    p.entrar(mas ? { ej, serie: j + 1, campo: 'kg' } : null)
  }
  if (apunte.ejercicioTerminado) {
    // Ejercicio terminado: al segundo se pliega y se abre el siguiente que falte
    setTimeout(() => {
      const actual = sesionEnCurso.value
      if (!actual || !terminado(actual.ejercicios[ej])) return
      const otro = siguienteSinTerminar(actual, ej)
      if (otro >= 0) p.abrir(otro)
      else p.setAbierto(-1)
    }, 1100)
  } else irASerie(j + 2)
}
