import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { formatClock, formatDecimal, formatRest } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { RestBar } from '../../components/RestBar.tsx'
import { WorkoutBar } from '../../components/WorkoutBar.tsx'
import { WorkoutExercise } from '../../components/WorkoutExercise.tsx'
import { WorkoutExerciseRow } from '../../components/WorkoutExerciseRow.tsx'
import { WorkoutKeypad } from '../../components/WorkoutKeypad.tsx'
import { TipsBanner } from '../../components/SessionTips.tsx'
import { ConfirmSheet, FinishSheet } from '../../components/WorkoutSheets.tsx'
import { notaSugerido, sesionDe, type SesionPlan, textoReps } from '../../state/plan.ts'
import {
  calentamientosHoy,
  consejosAlEmpezar,
  paraConsejos,
  primeroSinTerminar,
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
  filaHoy,
  grises,
  guardarSesion,
  nombreHoy,
  nuevaSesion,
  segundosSesion,
  SERIE_VACIA,
  seriesVistas,
  pautaHoy,
  sesionEnCurso,
  tomarPedido,
  textoSerie,
  type EjercicioEnCurso,
  type SerieEnCurso,
} from '../../state/sesionEnCurso.ts'
import { anadirExtra, cambiarExtra, enSuperserie, quitarExtra } from '../../state/seriesEspeciales.ts'
import { effortLabel } from '../../state/routines.ts'
import { guardarNota, notaDe } from '../../use-cases/exerciseNotes.ts'
import { consejosDeSesion } from '../../use-cases/sessionTips.ts'
import { avisar } from '../../use-cases/workoutFeedback.ts'
import { HojasEjercicio } from './HojasEjercicio.tsx'
import { HojasSesion, type HojaSesion } from './HojasSesion.tsx'
import { useAviso } from './useAviso.ts'
import { useReloj } from './useReloj.ts'
import { useTeclado } from './useTeclado.ts'
import { cambiarDesdeSesion, terminarEntreno } from '../../use-cases/training.ts'
import { SinPlan } from '../comun/SinPlan.tsx'
import { usePlan } from '../comun/usePlan.ts'
import { irAEjercicio } from './desplazar.ts'
import { trasMarcar } from './trasMarcar.ts'
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
    irAEjercicio((sesionEnCurso.value?.orden ?? []).indexOf(ej) + 1)
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

    trasMarcar(apunte, ej, j, {
      ahora,
      activa: Boolean(activa),
      setDescanso,
      entrar,
      decir,
      abrir,
      setAbierto,
    })
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
          const pauta = `${e.series} series de ${textoReps(e)} reps, ${effortLabel(e.rir)}`
          const x = en.ejercicios[i]
          const nombre = nombreHoy(e, x)
          if (i !== abierto) {
            return (
              <WorkoutExerciseRow
                key={`${i}-${e.nombre}`}
                numero={pos + 1}
                nombre={nombre}
                detalle={`${pauta} · ${formatRest(descansoDe(e))}`}
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
              pauta={[...pautaHoy(e, x), ...(enSuperserie(en, i) ? ['Superserie'] : [])]}
              descanso={formatRest(descansoDe(e))}
              onDescanso={() => setHoja({ tipo: 'descanso', ejercicio: e, segundos: descansoDe(e) })}
              sugerido={x.cambiadoPor ? null : notaSugerido(e)}
              nota={notaDe(nombre) || x.nota}
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
              fila={filaHoy(e, x)}
              onAnadirExtra={(j) => guardar(i, (y) => anadirExtra(y, j))}
              onCambioExtra={(j, n, campo, valor) => guardar(i, (y) => cambiarExtra(y, j, n, campo, valor))}
              onQuitarExtra={(j, n) => guardar(i, (y) => quitarExtra(y, j, n))}
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
          onCambiar={(n, alcance) => {
            guardarSesion(cambiarEjercicio(en, hojaDe, n))
            // En tu plan solo se cambian los de la rutina (no los añadidos hoy)
            decir(cambiarDesdeSesion(ejercicios[hojaDe], n, alcance === 'plan' && hojaDe < en.base.length))
            setHojaDe(null)
          }}
          onNota={(nota) => {
            // Tus notas se guardan para siempre en el ejercicio (la de la sesión, de antes, se vacía)
            void guardarNota(nombreHoy(ejercicios[hojaDe], en.ejercicios[hojaDe]), nota)
            guardar(hojaDe, (y) => ({ ...y, nota: '' }))
            decir(nota ? 'Nota guardada en su ficha' : 'Nota borrada')
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
