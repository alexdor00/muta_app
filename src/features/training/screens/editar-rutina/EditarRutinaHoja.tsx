import { useState } from 'preact/hooks'
import { formatRest } from '../../../../shared/lib/format.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { EditExerciseSheet, type PautaEdicion } from '../../components/EditExerciseSheet.tsx'
import { EditRoutineSheet } from '../../components/EditRoutineSheet.tsx'
import { EditWeekSheet } from '../../components/EditWeekSheet.tsx'
import { SwapSheet } from '../../components/SwapSheet.tsx'
import { DangerSheet } from '../../components/WorkoutSheets.tsx'
import {
  anadir,
  cambiarPauta,
  claveDe,
  descansosPorSesion,
  detalleSesion,
  mover,
  moverFila,
  nombresDeSesiones,
  pautaDe,
  rangosSerie,
  superserieDe,
  superseries,
  tecnicaElegida,
  tecnicaParaEditar,
  unirEnSuperserie,
  textoReps,
  quitar,
  sesiones,
  tocaHoy,
  tuPlan,
  type FilaSemana,
} from '../../state/plan.ts'
import { descansoDe, elegirDescanso } from '../../state/sesionEnCurso.ts'
import { MUSCLES, muscleInPlan, type MuscleId } from '../../state/routines.ts'
import { huecosDelPlan } from '../../use-cases/muscleSheet.ts'
import { equivalentesDe } from '../../use-cases/exerciseLibrary.ts'
import { fueraDeTuMaterial } from '../../use-cases/myEquipment.ts'
import { cambiarEjercicioDelPlan } from '../../use-cases/changeExercise.ts'
import { fotosSesion } from '../../state/fotos.ts'
import { FotoSesionHoja } from '../foto-sesion/FotoSesionHoja.tsx'
import {
  anadirSesion,
  cambiarSemana,
  edicionDe,
  editarSesion,
  quitarSesion,
  renombrarSesion,
  volverARutina,
} from '../../use-cases/editPlan.ts'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { guiaDeLaSemana, semanaParaEditar } from './semana.ts'

type Hoja =
  | 'semana'
  | 'volverTodo'
  | 'quitarSesion'
  | 'lista'
  | 'ejercicio'
  | 'cambiar'
  | 'biblioteca'
  | 'volver'
  | 'foto'

type Aviso = { texto: string; deshacer?: () => void }

/**
 * Editar rutina (A11–A13, desde «Tu rutina»), tres pantallas con el mismo patrón (propuesta del 2026-11-14): una lista en
 * una tarjeta; el asa (≡) mueve; deslizar a la izquierda quita, con «Deshacer»; «‹» arriba vuelve. Primero tu semana
 * (sesiones y descansos en una lista; el «+» añade un día de entrenamiento —una sesión vacía— o de descanso); una sesión
 * abre sus ejercicios (su nombre, su foto, añadir de la biblioteca); un ejercicio, su pauta con − / + y lo
 * demás en «Más opciones». Todo se guarda en tu plan para todas las semanas. Desde «Tu entrenador» llega con un músculo
 * (`musculo`): arriba lo dice y se marcan las sesiones y los ejercicios que lo entrenan, para cambiarlo ahí.
 */
export function EditarRutinaHoja({
  musculo = null,
  onClose,
}: {
  musculo?: MuscleId | null
  onClose: () => void
}) {
  const lista = sesiones.value
  const [sigla, setSigla] = useState(tocaHoy.value?.sigla ?? lista[0]?.sigla ?? '')
  const [abierto, setAbierto] = useState<number | null>(null)
  // Se abre con tu semana; tocar una sesión abre sus ejercicios
  const [hoja, setHoja] = useState<Hoja>('semana')
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [quitando, setQuitando] = useState<string | null>(null)
  const sesion = lista.find((s) => s.sigla === sigla) ?? lista[0]
  const plan = tuPlan.value.status === 'ready' ? tuPlan.value : null
  if (!sesion) return null
  const titulos = nombresDeSesiones(lista)
  // El músculo que llega del entrenador: los ejercicios que lo entrenan de forma directa, sesión a sesión
  const foco = musculo ? muscleInPlan(huecosDelPlan(lista), musculo).directos : []
  const nombreMusculo = musculo ? MUSCLES[musculo].label : ''
  const marcados = (s: string) => foco.filter((h) => h.sigla === s).map((h) => h.nombre)
  const porSesion = plan ? descansosPorSesion(plan.descansos, lista.length) : lista.map(() => 0)
  const grupos = superseries(sesion.ejercicios)
  const nombre = titulos[sesion.sigla]
  const e = abierto !== null ? (sesion.ejercicios[abierto] ?? null) : null
  const editar = (cambio: Parameters<typeof editarSesion>[1]) => void editarSesion(sesion.sigla, cambio)
  // Un ejercicio de la biblioteca a esta sesión, con 3 series y lo típico de la biblioteca (no repite uno que ya está)
  const anadirDeLaBiblioteca = (ex: { name: string; reps: [number, number]; rir: number; restSec: number }) =>
    editar((ed) =>
      anadir(
        ed,
        { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec },
        sesion.ejercicios.map((x) => x.nombre),
      ),
    )
  const decir = (texto: string, deshacer?: () => void) => {
    setAviso({ texto, deshacer })
    setTimeout(() => setAviso((a) => (a?.texto === texto ? null : a)), deshacer ? 4000 : 2500)
  }
  const avisoVisible = (
    <Toast
      message={aviso?.texto ?? null}
      action={
        aviso?.deshacer
          ? {
              label: 'Deshacer',
              onClick: () => {
                aviso.deshacer?.()
                setAviso(null)
              },
            }
          : null
      }
    />
  )
  const aLista = () => {
    setHoja('lista')
    setAbierto(null)
  }

  // Tu semana como una sola lista: cada sesión y, detrás, sus días de descanso
  const { filas, semana } = semanaParaEditar(lista, titulos, porSesion, marcados)
  const ponFilas = (nuevas: FilaSemana[], texto?: string) => {
    const antes = filas
    void cambiarSemana(nuevas)
    if (texto) decir(texto, () => void cambiarSemana(antes))
  }

  if (hoja === 'semana') {
    return (
      <>
        <EditWeekSheet
          filas={semana}
          guia={guiaDeLaSemana(nombreMusculo, foco.length > 0)}
          onSesion={(s) => {
            setSigla(s)
            setHoja('lista')
          }}
          onMover={(de, a) => ponFilas(moverFila(filas, de, a))}
          onQuitar={(i) => {
            const f = filas[i]
            if (f.tipo === 'descanso')
              ponFilas(
                filas.filter((_, j) => j !== i),
                'Día de descanso quitado',
              )
            else {
              setQuitando(f.sigla)
              setHoja('quitarSesion')
            }
          }}
          onAnadirSesion={() =>
            void anadirSesion().then((s) => {
              if (!s) return
              setSigla(s)
              setHoja('lista')
              decir('Sesión nueva: añádele ejercicios')
            })
          }
          onAnadirDescanso={() =>
            ponFilas([...filas, { tipo: 'descanso' }], 'Día de descanso al final: muévelo con ≡')
          }
          onVolver={() => setHoja('volverTodo')}
          onClose={onClose}
        />
        {avisoVisible}
      </>
    )
  }

  if (hoja === 'quitarSesion' && quitando) {
    const n = titulos[quitando] ?? 'esta sesión'
    return (
      <DangerSheet
        titulo={`¿Quitar ${n}?`}
        texto="Sale de tu semana con sus ejercicios."
        accion="Quitar"
        onSi={() => {
          void quitarSesion(quitando)
          decir(`${n} quitada`)
          setQuitando(null)
          setHoja('semana')
        }}
        onClose={() => setHoja('semana')}
      />
    )
  }

  if (hoja === 'volverTodo') {
    return (
      <DangerSheet
        normal
        titulo="Volver a la rutina original"
        texto="Todas las sesiones vuelven a como venían: su orden, sus ejercicios y su pauta, los ejercicios cambiados, los días de descanso, sus nombres y lo elegido para cada músculo. Las sesiones que añadiste se quitan."
        accion="Volver a la original"
        onSi={() => {
          void volverARutina(null)
          decir('Toda la rutina vuelve a la original')
          setHoja('semana')
        }}
        onClose={() => setHoja('semana')}
      />
    )
  }

  if (hoja === 'biblioteca') {
    return (
      <BibliotecaHoja
        musculo={e?.musculo ?? null}
        onElegir={(ex) => {
          if (e) cambiarEjercicioDelPlan(sesion.sigla, sesion.ejercicios, e, ex.name)
          else anadirDeLaBiblioteca(ex)
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

  if (hoja === 'foto') return <FotoSesionHoja sigla={sesion.sigla} onClose={() => setHoja('lista')} />

  if (hoja === 'volver') {
    return (
      <DangerSheet
        normal
        titulo={`¿Volver ${nombre} a la original?`}
        texto="Vuelve como venía: su orden, sus ejercicios, su pauta y su nombre."
        accion="Volver a la original"
        onSi={() => {
          void volverARutina(sesion.sigla)
          decir(`${nombre} vuelve a la original`)
          setHoja('lista')
        }}
        onClose={() => setHoja('lista')}
      />
    )
  }

  // Quitar un ejercicio (deslizando o desde su hoja): sale en todas las semanas; «Deshacer» lo devuelve
  const quitarEjercicio = (i: number) => {
    const x = sesion.ejercicios[i]
    if (!x) return
    const antes = edicionDe(sesion.sigla)
    const s = sesion.sigla
    editar((ed) => quitar(ed, claveDe(x)))
    decir(`${x.nombre} quitado`, () => void editarSesion(s, () => antes))
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
        tecnica={tecnicaParaEditar(e)}
        onTecnica={(v) => editar((ed) => cambiarPauta(ed, claveDe(e), { tecnica: tecnicaElegida(v) }))}
        onCambiar={() => setHoja('cambiar')}
        onQuitar={() => {
          quitarEjercicio(abierto)
          aLista()
        }}
        onVolver={aLista}
        onClose={onClose}
      />
    )
  }

  return (
    <>
      <EditRoutineSheet
        nombre={nombre}
        detalle={sesion.ejercicios.length ? detalleSesion(sesion) : 'Sin ejercicios: añade el primero'}
        onSemana={() => setHoja('semana')}
        fotoPropia={Boolean(fotosSesion.value[sesion.sigla])}
        onFoto={() => setHoja('foto')}
        onRenombrar={(n) => {
          void renombrarSesion(sesion.sigla, n)
          decir(`Ahora se llama «${n}»`)
        }}
        guia={
          musculo && marcados(sesion.sigla).length
            ? `${nombreMusculo}: toca el ejercicio marcado y cambia sus series.`
            : null
        }
        filas={sesion.ejercicios.map((x, i) => {
          const g = grupos[i]
          // En superserie, el primero «pasa al siguiente»; el último lleva el descanso de la pareja
          const sigue = g && g[g.length - 1] !== i
          return {
            nombre: x.nombre,
            // «4 series · 8–15 reps · 1:30»: con cada serie distinta, el rango de todas y la nota debajo
            detalle: `${x.series} ${x.series === 1 ? 'serie' : 'series'} · ${x.reps} reps · ${sigue ? 'pasa al siguiente' : formatRest(descansoDe(x))}`,
            superserie: g
              ? g[0] === i
                ? ('inicio' as const)
                : sigue
                  ? ('medio' as const)
                  : ('fin' as const)
              : null,
            nota:
              [
                x.repsSerie ? `Cada serie distinta: ${textoReps(x)}` : null,
                x.enLugarDe ? `En lugar de ${x.enLugarDe}` : x.anadido ? 'Añadido por ti' : null,
              ]
                .filter(Boolean)
                .join(' · ') || null,
            marca: marcados(sesion.sigla).includes(x.nombre) ? nombreMusculo : null,
          }
        })}
        onAbrir={(i) => {
          setAbierto(i)
          setHoja('ejercicio')
        }}
        onMover={(de, a) => editar((ed) => mover(ed, sesion.ejercicios, de, a))}
        onQuitar={quitarEjercicio}
        onAnadir={() => {
          setAbierto(null)
          setHoja('biblioteca')
        }}
        onVolver={() => setHoja('volver')}
        onClose={onClose}
      />
      {avisoVisible}
    </>
  )
}
