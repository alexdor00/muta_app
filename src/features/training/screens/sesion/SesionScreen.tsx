import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatClock, formatDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { RestBar } from '../../components/RestBar.tsx'
import { WorkoutBar } from '../../components/WorkoutBar.tsx'
import { WorkoutExercise, WorkoutExerciseRow } from '../../components/WorkoutExercise.tsx'
import { WorkoutKeypad } from '../../components/WorkoutKeypad.tsx'
import { TipsBanner } from '../../components/SessionTips.tsx'
import { ConfirmSheet, FinishSheet } from '../../components/WorkoutSheets.tsx'
import { sesionDe, type SesionPlan } from '../../state/plan.ts'
import {
  calentamientosHoy,
  consejosAlEmpezar,
  paraConsejos,
  primeroSinTerminar,
  siguienteSinTerminar,
} from '../../state/ordenHoy.ts'
import {
  alternarPausa,
  apuntarSerie,
  cambiarEjercicio,
  avisoAlTerminar,
  cuentaSeries,
  ejerciciosDe,
  descansoDe,
  filaCerrada,
  grises,
  guardarSesion,
  nombreHoy,
  nuevaSesion,
  segundosSesion,
  SERIE_VACIA,
  seriesVistas,
  sesionEnCurso,
  terminado,
  tomarPedido,
  textoSerie,
  type EjercicioEnCurso,
  type SerieEnCurso,
} from '../../state/sesionEnCurso.ts'
import { effortLabel } from '../../state/routines.ts'
import { consejosDeSesion } from '../../use-cases/sessionTips.ts'
import { avisar } from '../../use-cases/workoutFeedback.ts'
import { HojasEjercicio } from './HojasEjercicio.tsx'
import { HojasSesion, type HojaSesion } from './HojasSesion.tsx'
import { useAviso } from './useAviso.ts'
import { useReloj } from './useReloj.ts'
import { useTeclado } from './useTeclado.ts'
import { terminarEntreno } from '../../use-cases/training.ts'
import { SinPlan } from '../comun/SinPlan.tsx'
import { usePlan } from '../comun/usePlan.ts'
import styles from './SesionScreen.module.css'

/**
 * La sesión en curso (C01–C06): barra con Salir, tiempo, Terminar y la raya de progreso; el ejercicio abierto con su
 * calentamiento y sus series (la vez anterior en gris), el teclado propio, el descanso y el récord; los demás cerrados.
 * Lo apuntado se guarda en IndexedDB a cada cambio (use-cases/training.ts).
 */
export function SesionScreen(props: { sessionId: string }) {
  const { route, path } = useLocation()
  const plan = usePlan()
  const delPlan = sesionDe(props.sessionId)
  const guardada = sesionEnCurso.value
  // La sesión empezada manda (lleva sus ejercicios): así sigue igual aunque el plan haya pasado de semana
  const en = guardada?.sigla.toLowerCase() === props.sessionId.toLowerCase() ? guardada : null
  const sesion: SesionPlan | null = en
    ? { sigla: en.sigla, nombre: en.nombre, minutos: delPlan?.minutos ?? 0, ejercicios: en.base }
    : delPlan
  const [abierto, setAbierto] = useState(() => tomarPedido() ?? primeroSinTerminar(en))
  const { activa, entrar, tecla, siguiente, teclado, vista } = useTeclado(en)
  const { ahora, descanso, setDescanso, quedanDescanso, tiempoDescanso } = useReloj()
  const { aviso, setAviso, deshacer, setDeshacer, decir } = useAviso()
  const [confirmar, setConfirmar] = useState<{ ej: number; serie: number } | null>(null)
  // El ejercicio cuyo «···» está abierto, y el aviso de terminar con series sin marcar
  const [hojaDe, setHojaDe] = useState<number | null>(null)
  const [terminar, setTerminar] = useState<{ titulo: string; texto: string } | null>(null)
  // «Mostrar al empezar»: la hoja de consejos se abre al entrar si aún no hay ninguna serie hecha
  const [hoja, setHoja] = useState<HojaSesion | null>(() =>
    consejosAlEmpezar.value && !(en && cuentaSeries(en).hechas) ? { tipo: 'consejos' } : null,
  )

  useEffect(() => {
    // Solo en su dirección: al descartar, el enrutador vuelve a pintar esta pantalla un momento mientras sale, y no
    // debe dejar otra sesión vacía contando
    if (delPlan && !en && path === paths.session(delPlan.sigla.toLowerCase()))
      guardarSesion(nuevaSesion(delPlan, ahora))
  }, [delPlan, en, ahora, path])

  if (plan.status === 'loading') return null
  if (plan.status === 'none' && !en) return <SinPlan />
  if (!sesion) {
    return (
      <Pending code="404" title="Esta sesión no existe">
        <a href={paths.training}>Volver a Tu plan</a>
      </Pending>
    )
  }
  if (!en) return null

  const id = sesion.sigla.toLowerCase()
  const ejercicios = ejerciciosDe(en)
  const calientes = calentamientosHoy(en)
  const consejos = consejosDeSesion(paraConsejos(en))
  const { hechas, total } = cuentaSeries(en)

  const guardar = (ej: number, cambio: (x: EjercicioEnCurso) => EjercicioEnCurso) =>
    guardarSesion({ ...en, ejercicios: en.ejercicios.map((x, i) => (i === ej ? cambio(x) : x)) })
  const cambiarSerie = (ej: number, serie: number, cambio: Partial<SerieEnCurso>) =>
    guardar(ej, (x) => ({ ...x, series: x.series.map((s, k) => (k === serie ? { ...s, ...cambio } : s)) }))

  /** Cambiar de sesión o descartarla: se borra lo apuntado, la rotación no avanza y se vuelve a Tu plan. */
  const salirSinGuardar = () => {
    guardarSesion(null)
    setDescanso(null)
    route(paths.training)
  }

  /** Termina la sesión (se guarda solo lo hecho) y abre el resumen. */
  const terminarYa = () => {
    void terminarEntreno(en, ahora)
    setDescanso(null)
    route(paths.summary(id))
  }

  const abrir = (ej: number) => {
    setAbierto(ej)
    entrar(null)
    requestAnimationFrame(() =>
      document
        .getElementById(`ejercicio-${(sesionEnCurso.value?.orden ?? []).indexOf(ej) + 1}`)
        ?.closest('section')
        ?.scrollIntoView({ block: 'start' }),
    )
  }

  /** Marca (o desmarca) una serie; un toque apunta lo gris. */
  function marcar(ej: number, j: number, confirmado = false) {
    if (!en || !sesion) return
    if (en.ejercicios[ej].series[j].hecha) {
      cambiarSerie(ej, j, { hecha: false })
      return
    }
    const apunte = apuntarSerie(en, ej, j, confirmado)
    if (apunte.tipo !== 'hecha') {
      if (apunte.tipo === 'alto') return setConfirmar({ ej, serie: j })
      if (apunte.tipo === 'imposible') avisar('inputError')
      return decir(
        apunte.tipo === 'imposible'
          ? 'Revisa los números: de 0 a 600 kg y hasta 100 repeticiones'
          : 'Apunta las repeticiones que hiciste',
      )
    }

    guardarSesion(apunte.sesion)
    const c = apunte.comparacion
    avisar(c === 1 ? 'record' : c === 0 ? 'betterThanLast' : 'setLogged')
    setDescanso(apunte.descanso === null ? null : { fin: ahora + apunte.descanso * 1000, avisado: false })
    if (apunte.bajada) {
      decir(`Bajaste de ${apunte.bajada.de} a ${apunte.bajada.a} reps. Descansa 1 minuto más.`)
    }
    // Con el teclado abierto sigue en los kilos de la serie siguiente
    if (activa) {
      const mas = j + 1 < en.ejercicios[ej].series.length
      entrar(mas ? { ej, serie: j + 1, campo: 'kg' } : null)
    }
    if (apunte.ejercicioTerminado) {
      // Ejercicio terminado: al segundo se pliega y se abre el siguiente que falte
      setTimeout(() => {
        const actual = sesionEnCurso.value
        if (!actual || !terminado(actual.ejercicios[ej])) return
        const otro = siguienteSinTerminar(actual, ej)
        if (otro >= 0) abrir(otro)
        else setAbierto(-1)
      }, 1100)
    } else {
      requestAnimationFrame(() =>
        document
          .querySelector(`[aria-label="Kilos de la serie ${j + 2}"]`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
      )
    }
  }

  return (
    <div class={`${styles.page} ${activa ? styles.withKeypad : ''}`}>
      <WorkoutBar
        tiempo={formatClock(segundosSesion(en, ahora))}
        progreso={`${sesion.sigla} · ${hechas} de ${total} series`}
        hechas={hechas}
        total={total}
        salirHref={paths.sessionView(id)}
        pausada={en.pausadaEn !== null}
        onPausa={() => guardarSesion(alternarPausa(en, ahora))}
        onSesion={() => setHoja({ tipo: 'sesion' })}
        onTerminar={() => {
          if (!hechas) return decir('Marca al menos una serie como hecha')
          const pregunta = avisoAlTerminar(en)
          if (pregunta) return setTerminar(pregunta)
          terminarYa()
        }}
      />
      <h1 class={styles.hidden}>
        {sesion.sigla} {sesion.nombre}, en curso
      </h1>
      <div class={styles.list}>
        {consejos.length > 0 && !hechas && !en.consejosVistos && (
          <TipsBanner
            cuantos={consejos.length}
            onAbrir={() => {
              guardarSesion({ ...en, consejosVistos: true })
              setHoja({ tipo: 'consejos' })
            }}
          />
        )}
        {en.orden.map((i, pos) => {
          const e = ejercicios[i]
          const pauta = `${e.series} series de ${e.reps} reps, ${effortLabel(e.rir)}`
          const x = en.ejercicios[i]
          const nombre = nombreHoy(e, x)
          if (i !== abierto) {
            return (
              <WorkoutExerciseRow
                key={`${i}-${e.nombre}`}
                numero={pos + 1}
                nombre={nombre}
                detalle={`${pauta} · ${formatClock(descansoDe(e))}`}
                {...filaCerrada(e, x)}
                onAbrir={() => abrir(i)}
              />
            )
          }
          // El calentamiento solo antes de empezar las series del ejercicio
          const calienta = x.series.some((s) => s.hecha) ? [] : (calientes[i] ?? [])
          return (
            <WorkoutExercise
              key={`${i}-${e.nombre}`}
              numero={pos + 1}
              nombre={nombre}
              pauta={[`${e.series} series`, `${e.reps} reps`, effortLabel(e.rir)]}
              descanso={formatClock(descansoDe(e))}
              onDescanso={() => setHoja({ tipo: 'descanso', ejercicio: e, segundos: descansoDe(e) })}
              nota={x.nota}
              onOpciones={() => setHojaDe(i)}
              calentamiento={calienta.map((c, k) => ({
                kilos: formatDecimal(c.kilos),
                reps: c.reps,
                hecha: x.calentamiento[k],
              }))}
              onCalentamiento={(k) => {
                if (!x.calentamiento[k]) avisar('betterThanLast')
                guardar(i, (y) => ({
                  ...y,
                  calentamiento: calienta.map((_, n) =>
                    n === k ? !y.calentamiento[n] : !!y.calentamiento[n],
                  ),
                }))
              }}
              series={seriesVistas(e, x)}
              activa={activa?.ej === i ? { serie: activa.serie, campo: activa.campo } : null}
              onFoco={(serie, campo) => {
                entrar({ ej: i, serie, campo })
              }}
              onCambio={(serie, campo, valor) => cambiarSerie(i, serie, { [campo]: valor })}
              onMarcar={(j) => marcar(i, j)}
              onEliminar={(j) => {
                if (x.series.length <= 1) return decir('El ejercicio necesita al menos una serie')
                entrar(null)
                avisar('setLogged')
                setDeshacer(en)
                setAviso(`Serie ${j + 1} eliminada`)
                guardar(i, (y) => ({ ...y, series: y.series.filter((_, k) => k !== j) }))
              }}
              onAnadirSerie={() =>
                guardar(i, (y) => {
                  const ultima = y.series.length - 1
                  const kg = ultima >= 0 ? y.series[ultima].kg || grises(e, y, ultima).kg : ''
                  return { ...y, series: [...y.series, { ...SERIE_VACIA, kg }] }
                })
              }
            />
          )
        })}
        <button type="button" class={styles.addExercise} onClick={() => setHoja({ tipo: 'anadir' })}>
          <PlusIcon />
          Añadir ejercicio
        </button>
        <button type="button" class={styles.discard} onClick={() => setHoja({ tipo: 'descartar' })}>
          Descartar sesión
        </button>
      </div>

      {descanso && !activa && (
        <RestBar quedan={quedanDescanso} tiempo={tiempoDescanso} onSaltar={() => setDescanso(null)} />
      )}

      {vista && (
        <div ref={teclado}>
          <WorkoutKeypad
            {...vista}
            descanso={
              descanso
                ? {
                    tiempo: tiempoDescanso,
                    quedan: quedanDescanso,
                    onSaltar: () => setDescanso(null),
                  }
                : null
            }
            onTecla={tecla}
            onSiguiente={siguiente}
            onCerrar={() => entrar(null)}
          />
        </div>
      )}

      {confirmar && (
        <ConfirmSheet
          texto={`${textoSerie(ejercicios[confirmar.ej], en.ejercicios[confirmar.ej], confirmar.serie)}. Es un número muy alto.`}
          onSi={() => {
            setConfirmar(null)
            marcar(confirmar.ej, confirmar.serie, true)
          }}
          onClose={() => setConfirmar(null)}
        />
      )}

      {hoja && (
        <HojasSesion
          hoja={hoja}
          onHoja={setHoja}
          sesion={sesion}
          en={en}
          consejos={consejos}
          ahora={ahora}
          onSalir={salirSinGuardar}
          onAviso={decir}
          onAnadido={abrir}
        />
      )}

      {terminar && <FinishSheet {...terminar} onTerminar={terminarYa} onClose={() => setTerminar(null)} />}

      {hojaDe !== null && (
        <HojasEjercicio
          e={ejercicios[hojaDe]}
          x={en.ejercicios[hojaDe]}
          nombre={nombreHoy(ejercicios[hojaDe], en.ejercicios[hojaDe])}
          desde={{ sesion: id, ejercicio: hojaDe }}
          en={en}
          onAviso={decir}
          onAbrir={abrir}
          onCambiar={(n) => {
            guardarSesion(cambiarEjercicio(en, hojaDe, n))
            decir(`Cambiado por ${n}, solo para hoy`)
            setHojaDe(null)
          }}
          onNota={(nota) => {
            guardar(hojaDe, (y) => ({ ...y, nota }))
            setHojaDe(null)
          }}
          onCronometro={(serie, r) => {
            if (r.reps !== null) cambiarSerie(hojaDe, serie, { reps: String(r.reps) })
            decir(
              r.reps !== null
                ? `${r.reps} reps en ${formatClock(r.segundos)}. Marca la serie cuando quieras`
                : `Serie de ${formatClock(r.segundos)}. Márcala como hecha`,
            )
          }}
          onCerrar={() => setHojaDe(null)}
        />
      )}

      <Toast
        message={aviso}
        action={
          deshacer && {
            label: 'Deshacer',
            onClick: () => {
              guardarSesion(deshacer)
              setAviso(null)
            },
          }
        }
      />
    </div>
  )
}
