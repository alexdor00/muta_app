import { useState } from 'preact/hooks'
import { formatRest } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { EditExerciseSheet, type PautaEdicion } from '../../components/EditExerciseSheet.tsx'
import { CoachSheet } from '../../components/CoachSheet.tsx'
import { EditRoutineSheet } from '../../components/EditRoutineSheet.tsx'
import { EditWeekSheet, RestAfterSheet } from '../../components/EditWeekSheet.tsx'
import { SwapSheet } from '../../components/SwapSheet.tsx'
import { DangerSheet } from '../../components/WorkoutSheets.tsx'
import {
  anadir,
  cambiarPauta,
  claveDe,
  descansosPorSesion,
  mover,
  nombresDeSesiones,
  pautaDe,
  rangosSerie,
  superserieDe,
  superseries,
  unirEnSuperserie,
  textoReps,
  quitar,
  sesiones,
  tocaHoy,
  trasDe,
  tuPlan,
} from '../../state/plan.ts'
import { descansoDe, elegirDescanso } from '../../state/sesionEnCurso.ts'
import { equivalentesDe } from '../../use-cases/exerciseLibrary.ts'
import { consejosDelEntrenador } from '../../use-cases/coverage.ts'
import { fueraDeTuMaterial } from '../../use-cases/myEquipment.ts'
import { cambiarEjercicioDelPlan } from '../../use-cases/changeExercise.ts'
import { fotosSesion } from '../../state/fotos.ts'
import { FotoSesionHoja } from '../foto-sesion/FotoSesionHoja.tsx'
import { cambiarDescansos, editarSesion, renombrarSesion, volverARutina } from '../../use-cases/training.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import styles from './EditarRutinaHoja.module.css'

type Hoja =
  | 'semana'
  | 'descansoTras'
  | 'volverTodo'
  | 'lista'
  | 'ejercicio'
  | 'cambiar'
  | 'biblioteca'
  | 'quitar'
  | 'volver'
  | 'foto'
  | 'consejos'

/**
 * Editar rutina (A11–A13, desde «Tu rutina»): primero tu semana, en orden, con sus días de descanso (quitar y añadir
 * «después de qué sesión»); tocar una sesión abre sus ejercicios: reordenar, añadir de la biblioteca, editar la pauta,
 * cambiarlo por otro (los del programa y los que hacen lo mismo), quitarlo, su foto, su nombre y el entrenador (consejos y
 * cobertura del método). Todo se guarda en tu plan para todas las semanas.
 */
export function EditarRutinaHoja({ onClose }: { onClose: () => void }) {
  const lista = sesiones.value
  const [sigla, setSigla] = useState(tocaHoy.value?.sigla ?? lista[0]?.sigla ?? '')
  const [abierto, setAbierto] = useState<number | null>(null)
  // Se abre con tu semana; tocar una sesión abre sus ejercicios
  const [hoja, setHoja] = useState<Hoja>('semana')
  const [aviso, setAviso] = useState<string | null>(null)
  const sesion = lista.find((s) => s.sigla === sigla) ?? lista[0]
  const plan = tuPlan.value.status === 'ready' ? tuPlan.value : null
  if (!sesion) return null
  const titulos = nombresDeSesiones(lista)
  const porSesion = plan ? descansosPorSesion(plan.descansos, lista.length) : lista.map(() => 0)
  const consejos = consejosDelEntrenador(sesion, lista)
  const grupos = superseries(sesion.ejercicios)
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

  const semana = lista.map((x) => ({
    sigla: x.sigla,
    nombre: titulos[x.sigla],
    ejercicios: x.ejercicios.length,
  }))
  const ponDescansos = (i: number, n: number) =>
    void cambiarDescansos(trasDe(porSesion.map((x, j) => (j === i ? Math.max(0, n) : x))))

  if (hoja === 'semana') {
    return (
      <>
        <EditWeekSheet
          sesiones={semana}
          descansos={porSesion}
          onSesion={(s) => {
            setSigla(s)
            setHoja('lista')
          }}
          onQuitarDescanso={(i) => {
            ponDescansos(i, porSesion[i] - 1)
            decir('Día de descanso quitado')
          }}
          onAnadirDescanso={() => setHoja('descansoTras')}
          onVolver={() => setHoja('volverTodo')}
          onClose={onClose}
        />
        <Toast message={aviso} />
      </>
    )
  }

  if (hoja === 'descansoTras') {
    return (
      <RestAfterSheet
        sesiones={semana}
        onElegir={(i) => {
          ponDescansos(i, porSesion[i] + 1)
          decir(`Día de descanso después de ${semana[i].nombre}`)
          setHoja('semana')
        }}
        onClose={() => setHoja('semana')}
      />
    )
  }

  if (hoja === 'volverTodo') {
    return (
      <Sheet title="Volver a la rutina original" onClose={() => setHoja('semana')} large>
        <p class={styles.lead}>
          Todas las sesiones vuelven a como venían: su orden, sus ejercicios y su pauta, los ejercicios
          cambiados, los días de descanso, sus nombres y lo elegido para cada músculo.
        </p>
        <div class={styles.pair}>
          <Button variant="secondary" onClick={() => setHoja('semana')}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              void volverARutina(null)
              decir('Toda la rutina vuelve a la original')
              setHoja('semana')
            }}
          >
            Volver a la original
          </Button>
        </div>
      </Sheet>
    )
  }

  if (hoja === 'biblioteca') {
    return (
      <BibliotecaHoja
        musculo={e?.musculo ?? null}
        onElegir={(ex) => {
          const nombres = sesion.ejercicios.map((x) => x.nombre)
          const nuevo = { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec }
          if (e) cambiarEjercicioDelPlan(sesion.sigla, sesion.ejercicios, e, ex.name)
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
      cambiarEjercicioDelPlan(sesion.sigla, sesion.ejercicios, e, n)
      decir(n === e.enLugarDe ? `Vuelves a ${n}` : `Cambiado por ${n}`)
      aLista()
    }
    return (
      <SwapSheet
        soloPlan
        equivalentes={equivalentesDe(e).map((q) => ({ nombre: q.ex.name, motivo: q.motivo }))}
        sustitutos={e.sustitutos}
        noTienes={fueraDeTuMaterial([...equivalentesDe(e).map((q) => q.ex.name), ...e.sustitutos])}
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
      <Sheet title={`¿Volver ${nombre} a la original?`} onClose={() => setHoja('lista')} large>
        <p class={styles.lead}>Vuelve como venía: su orden, sus ejercicios, su pauta y su nombre.</p>
        <div class={styles.pair}>
          <Button variant="secondary" onClick={() => setHoja('lista')}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              void volverARutina(sesion.sigla)
              decir(`${nombre} vuelve a la original`)
              setHoja('lista')
            }}
          >
            Volver a la original
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
        seriesDistintas={rangosSerie(e)}
        onSeriesDistintas={(s) => editar((ed) => cambiarPauta(ed, claveDe(e), { repsSerie: s }))}
        superserie={superserieDe(sesion.ejercicios, abierto)}
        onSuperserie={(v) => editar((ed) => unirEnSuperserie(ed, sesion.ejercicios, abierto, v))}
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
        nombre={nombre}
        onSemana={() => setHoja('semana')}
        foto={fotosSesion.value[sesion.sigla] ?? null}
        onFoto={() => setHoja('foto')}
        onRenombrar={(n) => {
          void renombrarSesion(sesion.sigla, n)
          decir(`Ahora se llama «${n}»`)
        }}
        consejos={consejos.length}
        onConsejos={() => setHoja('consejos')}
        filas={sesion.ejercicios.map((x, i) => {
          const g = grupos[i]
          // En superserie, el primero «pasa al siguiente»; el último lleva el descanso de la pareja
          const sigue = g && g[g.length - 1] !== i
          return {
            nombre: x.nombre,
            detalle: `${x.series} × ${textoReps(x)} · ${sigue ? 'pasa al siguiente' : formatRest(descansoDe(x))}`,
            superserie: g
              ? g[0] === i
                ? ('inicio' as const)
                : sigue
                  ? ('medio' as const)
                  : ('fin' as const)
              : null,
            nota: x.enLugarDe ? `En lugar de ${x.enLugarDe}` : x.anadido ? 'Añadido por ti' : null,
          }
        })}
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
