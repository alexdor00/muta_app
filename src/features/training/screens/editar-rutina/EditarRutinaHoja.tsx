import { useState } from 'preact/hooks'
import { formatClock } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { EditExerciseSheet, type PautaEdicion } from '../../components/EditExerciseSheet.tsx'
import { EditRoutineSheet } from '../../components/EditRoutineSheet.tsx'
import { SwapSheet } from '../../components/SwapSheet.tsx'
import { DangerSheet } from '../../components/WorkoutSheets.tsx'
import {
  anadir,
  cambiarPauta,
  claveDe,
  EQUIPMENT_LABEL,
  mover,
  pautaDe,
  quitar,
  sesiones,
  tocaHoy,
  type EjercicioPlan,
} from '../../state/plan.ts'
import { MUSCLES, effortLabel } from '../../state/routines.ts'
import { descansoDe, elegirDescanso } from '../../state/sesionEnCurso.ts'
import { equivalentesDe, porNombre } from '../../use-cases/exerciseLibrary.ts'
import { cambiarEnPlan, editarSesion, volverARutina } from '../../use-cases/training.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import styles from './EditarRutinaHoja.module.css'

type Hoja = 'lista' | 'ejercicio' | 'cambiar' | 'biblioteca' | 'quitar' | 'volver'

/** Lo que se pone al añadir o copiar un ejercicio: su pauta de ahora. */
const comoAnadido = (e: EjercicioPlan) => ({
  nombre: e.nombre,
  series: e.series,
  reps: pautaDe(e).reps,
  rir: e.rir,
  descanso: descansoDe(e),
})

/**
 * Editar rutina (A11–A13, desde «Tu rutina»): la lista de cada sesión, reordenar, añadir de la biblioteca, editar la
 * pauta de un ejercicio, cambiarlo por otro (los del programa y los que hacen lo mismo), quitarlo y volver a la rutina.
 * Todo se guarda en tu plan para todas las semanas.
 */
export function EditarRutinaHoja({ onClose }: { onClose: () => void }) {
  const lista = sesiones.value
  const [sigla, setSigla] = useState(tocaHoy.value?.sigla ?? lista[0]?.sigla ?? '')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [hoja, setHoja] = useState<Hoja>('lista')
  const [aviso, setAviso] = useState<string | null>(null)
  const sesion = lista.find((s) => s.sigla === sigla) ?? lista[0]
  if (!sesion) return null
  const e = abierto !== null ? (sesion.ejercicios[abierto] ?? null) : null
  const editar = (cambio: Parameters<typeof editarSesion>[1]) => void editarSesion(sesion.sigla, cambio)
  const decir = (texto: string) => {
    setAviso(texto)
    setTimeout(() => setAviso(null), 2500)
  }
  const aLista = () => {
    setHoja('lista')
    setAbierto(null)
  }

  if (hoja === 'biblioteca') {
    return (
      <BibliotecaHoja
        musculo={e?.musculo ?? null}
        onElegir={(ex) => {
          const nombres = sesion.ejercicios.map((x) => x.nombre)
          const nuevo = { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec }
          if (e?.anadido)
            editar((ed) => anadir(quitar(ed, e.nombre), { ...comoAnadido(e), nombre: ex.name }, nombres))
          else if (e) void cambiarEnPlan(claveDe(e), ex.name === claveDe(e) ? null : ex.name)
          else editar((ed) => anadir(ed, nuevo, nombres))
          decir(e ? `Cambiado por ${ex.name}` : `${ex.name} añadido a ${sesion.sigla}`)
          aLista()
        }}
        onClose={aLista}
      />
    )
  }

  if (hoja === 'cambiar' && e) {
    const elegir = (n: string) => {
      if (e.anadido) {
        const nombres = sesion.ejercicios.map((x) => x.nombre)
        editar((ed) => anadir(quitar(ed, e.nombre), { ...comoAnadido(e), nombre: n }, nombres))
      } else void cambiarEnPlan(claveDe(e), n === claveDe(e) ? null : n)
      decir(n === e.enLugarDe ? `Vuelves a ${n}` : `Cambiado por ${n}`)
      aLista()
    }
    return (
      <SwapSheet
        soloPlan
        equivalentes={equivalentesDe(e).map((q) => ({ nombre: q.ex.name, motivo: q.motivo }))}
        sustitutos={e.sustitutos}
        enLugarDe={e.enLugarDe ?? null}
        onElegir={elegir}
        onBiblioteca={() => setHoja('biblioteca')}
        onClose={() => setHoja('ejercicio')}
      />
    )
  }

  if (hoja === 'quitar' && e) {
    return (
      <DangerSheet
        titulo={`¿Quitar ${e.nombre}?`}
        texto={`Sale de ${sesion.sigla} en todas las semanas. Puedes volver a la rutina original cuando quieras.`}
        accion="Quitar"
        onSi={() => {
          editar((ed) => quitar(ed, claveDe(e)))
          decir(`${e.nombre} quitado de ${sesion.sigla}`)
          aLista()
        }}
        onClose={() => setHoja('ejercicio')}
      />
    )
  }

  if (hoja === 'volver') {
    return (
      <Sheet title="Volver a la rutina original" onClose={() => setHoja('lista')} large>
        <p class={styles.lead}>Se quita lo que cambiaste: el orden, los ejercicios y su pauta.</p>
        <div class={styles.pair}>
          <Button
            variant="secondary"
            onClick={() => {
              void volverARutina(sesion.sigla)
              decir(`${sesion.sigla} vuelve a la rutina`)
              setHoja('lista')
            }}
          >
            Solo {sesion.sigla}
          </Button>
          <Button
            onClick={() => {
              void volverARutina(null)
              decir('Toda la rutina vuelve a la original')
              setHoja('lista')
            }}
          >
            Todas las sesiones
          </Button>
        </div>
      </Sheet>
    )
  }

  if (hoja === 'ejercicio' && e && abierto !== null) {
    const lib = porNombre(e.nombre)
    const chips = [e.musculo ? MUSCLES[e.musculo].label : null, lib ? EQUIPMENT_LABEL[lib.equipment] : null]
    const p = pautaDe(e)
    return (
      <EditExerciseSheet
        key={`${sesion.sigla}-${claveDe(e)}`}
        nombre={e.nombre}
        chips={chips.filter((c): c is string => Boolean(c))}
        pauta={{ ...p, descanso: descansoDe(e) }}
        otrasSesiones={lista
          .filter((s) => s.sigla !== sesion.sigla)
          .map((s) => ({ value: s.sigla, label: s.sigla }))}
        puedeSubir={abierto > 0}
        puedeBajar={abierto < sesion.ejercicios.length - 1}
        onGuardar={(n: PautaEdicion) => {
          editar((ed) =>
            cambiarPauta(ed, claveDe(e), {
              series: n.series,
              reps: n.reps,
              rir: n.rir,
              salto: n.salto,
              nota: n.nota,
            }),
          )
          if (n.descanso !== descansoDe(e)) elegirDescanso(e.nombre, n.descanso)
          decir('Cambios guardados')
          aLista()
        }}
        onCambiar={() => setHoja('cambiar')}
        onQuitar={() => setHoja('quitar')}
        onCopiar={(otra) => {
          const destino = lista.find((s) => s.sigla === otra)
          void editarSesion(otra, (ed) =>
            anadir(ed, comoAnadido(e), destino?.ejercicios.map((x) => x.nombre) ?? []),
          )
          decir(`Copiado a ${otra}`)
        }}
        onMover={(paso) => {
          editar((ed) => mover(ed, sesion.ejercicios, abierto, abierto + paso))
          setAbierto(abierto + paso)
        }}
        onVolver={aLista}
        onClose={onClose}
      />
    )
  }

  return (
    <>
      <EditRoutineSheet
        sesiones={lista.map((s) => ({ value: s.sigla, label: s.sigla }))}
        sigla={sesion.sigla}
        onSigla={setSigla}
        filas={sesion.ejercicios.map((x) => ({
          nombre: x.nombre,
          detalle: `${x.series} series de ${x.reps}, ${effortLabel(x.rir)}, ${formatClock(descansoDe(x))}`,
          nota: x.enLugarDe ? `En lugar de ${x.enLugarDe}` : x.anadido ? 'Añadido por ti' : null,
        }))}
        onAbrir={(i) => {
          setAbierto(i)
          setHoja('ejercicio')
        }}
        onMover={(de, a) => editar((ed) => mover(ed, sesion.ejercicios, de, a))}
        onAnadir={() => {
          setAbierto(null)
          setHoja('biblioteca')
        }}
        onVolver={() => setHoja('volver')}
        onClose={onClose}
      />
      <Toast message={aviso} />
    </>
  )
}
