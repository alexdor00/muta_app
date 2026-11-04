import { useState } from 'preact/hooks'
import { formatRest } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { EditExerciseSheet, type PautaEdicion } from '../../components/EditExerciseSheet.tsx'
import { CoachSheet } from '../../components/CoachSheet.tsx'
import { EditRoutineSheet } from '../../components/EditRoutineSheet.tsx'
import { SwapSheet } from '../../components/SwapSheet.tsx'
import { DangerSheet } from '../../components/WorkoutSheets.tsx'
import {
  anadir,
  cambiarPauta,
  claveDe,
  descansosPorSesion,
  mover,
  cortosDeSesiones,
  nombresDeSesiones,
  pautaDe,
  quitar,
  sesiones,
  tocaHoy,
  trasDe,
  tuPlan,
  type EjercicioPlan,
} from '../../state/plan.ts'
import { descansoDe, elegirDescanso } from '../../state/sesionEnCurso.ts'
import { equivalentesDe } from '../../use-cases/exerciseLibrary.ts'
import { consejosDelEntrenador } from '../../use-cases/coverage.ts'
import { fotosSesion } from '../../state/fotos.ts'
import { FotoSesionHoja } from '../foto-sesion/FotoSesionHoja.tsx'
import {
  cambiarDescansos,
  cambiarEnPlan,
  editarSesion,
  renombrarSesion,
  volverARutina,
} from '../../use-cases/training.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import styles from './EditarRutinaHoja.module.css'

type Hoja = 'lista' | 'ejercicio' | 'cambiar' | 'biblioteca' | 'quitar' | 'volver' | 'foto' | 'consejos'

/** Lo que se pone al cambiar un ejercicio añadido por otro: su pauta de ahora. */
const comoAnadido = (e: EjercicioPlan) => ({
  nombre: e.nombre,
  series: e.series,
  reps: pautaDe(e).reps,
  rir: e.rir,
  descanso: descansoDe(e),
})

/**
 * Editar rutina (A11–A13, desde «Tu rutina»): la lista de cada sesión (por su nombre), reordenar, añadir de la
 * biblioteca, editar la pauta de un ejercicio, cambiarlo por otro (los del programa y los que hacen lo mismo), quitarlo y
 * volver a la rutina. Todo se guarda en tu plan para todas las semanas. Arriba, tu semana (sesiones y descansos), la foto y
 * el nombre de la sesión; el entrenador (consejos de la sesión y cobertura del método) en una fila que abre su hoja.
 */
export function EditarRutinaHoja({ onClose }: { onClose: () => void }) {
  const lista = sesiones.value
  const [sigla, setSigla] = useState(tocaHoy.value?.sigla ?? lista[0]?.sigla ?? '')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [hoja, setHoja] = useState<Hoja>('lista')
  const [aviso, setAviso] = useState<string | null>(null)
  const sesion = lista.find((s) => s.sigla === sigla) ?? lista[0]
  const plan = tuPlan.value.status === 'ready' ? tuPlan.value : null
  if (!sesion) return null
  const titulos = nombresDeSesiones(lista)
  const cortos = cortosDeSesiones(lista)
  const consejos = consejosDelEntrenador(sesion, lista)
  const nombre = titulos[sesion.sigla]
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
          decir(e ? `Cambiado por ${ex.name}` : `${ex.name} añadido a ${nombre}`)
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
        texto={`Sale de ${nombre} en todas las semanas. Puedes volver a la rutina original cuando quieras.`}
        accion="Quitar"
        onSi={() => {
          editar((ed) => quitar(ed, claveDe(e)))
          decir(`${e.nombre} quitado de ${nombre}`)
          aLista()
        }}
        onClose={() => setHoja('ejercicio')}
      />
    )
  }

  if (hoja === 'consejos') {
    return (
      <>
        <CoachSheet
          sesion={nombre}
          consejos={consejos.map((c) => ({
            text: c.text,
            why: c.why,
            accion: c.anadir && {
              label: `Añadir ${c.anadir.name.charAt(0).toLowerCase()}${c.anadir.name.slice(1)}`,
              hecho: sesion.ejercicios.some((x) => x.nombre === c.anadir?.name),
              textoHecho: `Añadido a ${nombre}`,
              onClick: () => {
                const ex = c.anadir
                if (!ex) return
                const nuevo = { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec }
                editar((ed) =>
                  anadir(
                    ed,
                    nuevo,
                    sesion.ejercicios.map((x) => x.nombre),
                  ),
                )
                decir(`${ex.name} añadido a ${nombre}`)
              },
            },
          }))}
          onClose={() => setHoja('lista')}
        />
        <Toast message={aviso} />
      </>
    )
  }

  if (hoja === 'foto') return <FotoSesionHoja sigla={sesion.sigla} onClose={() => setHoja('lista')} />

  if (hoja === 'volver') {
    return (
      <Sheet title="Volver a la rutina original" onClose={() => setHoja('lista')} large>
        <p class={styles.lead}>
          Una sesión: su orden, sus ejercicios y su pauta. Todas: también los ejercicios cambiados, los
          descansos y lo elegido para cada músculo.
        </p>
        <div class={styles.pair}>
          <Button
            variant="secondary"
            onClick={() => {
              void volverARutina(sesion.sigla)
              decir(`${nombre} vuelve a la rutina`)
              setHoja('lista')
            }}
          >
            Solo {nombre}
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
    const { series, reps, rir } = pautaDe(e)
    return (
      <EditExerciseSheet
        key={`${sesion.sigla}-${claveDe(e)}`}
        nombre={e.nombre}
        sesion={nombre}
        pauta={{ series, reps, rir, descanso: descansoDe(e) }}
        onCambio={(n: PautaEdicion) => {
          editar((ed) => cambiarPauta(ed, claveDe(e), { series: n.series, reps: n.reps, rir: n.rir }))
          if (n.descanso !== descansoDe(e)) elegirDescanso(e.nombre, n.descanso)
        }}
        onCambiar={() => setHoja('cambiar')}
        onQuitar={() => setHoja('quitar')}
        onVolver={aLista}
        onClose={onClose}
      />
    )
  }

  return (
    <>
      <EditRoutineSheet
        sesiones={lista.map((s) => ({ value: s.sigla, label: titulos[s.sigla], corto: cortos[s.sigla] }))}
        descansos={plan ? descansosPorSesion(plan.descansos, lista.length) : lista.map(() => 0)}
        onDescansos={(n) => void cambiarDescansos(trasDe(n))}
        sigla={sesion.sigla}
        onSigla={setSigla}
        foto={fotosSesion.value[sesion.sigla] ?? null}
        onFoto={() => setHoja('foto')}
        onRenombrar={(n) => {
          void renombrarSesion(sesion.sigla, n)
          decir(`Ahora se llama «${n}»`)
        }}
        consejos={consejos.length}
        onConsejos={() => setHoja('consejos')}
        filas={sesion.ejercicios.map((x) => ({
          nombre: x.nombre,
          detalle: `${x.series} × ${x.reps} · ${formatRest(descansoDe(x))}`,
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
