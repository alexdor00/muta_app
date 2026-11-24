import { useLocation } from 'preact-iso'
import { useEffect, useRef, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { PencilIcon } from '../../../../shared/ui/icons.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { carouselStep, useDragScroll } from '../../../../shared/ui/useDragScroll.ts'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { CoachCard } from '../../components/CoachCard.tsx'
import { MusclesCard } from '../../components/MusclesCard.tsx'
import { SessionCard } from '../../components/SessionCard.tsx'
import { TuRutinaSheet } from '../../components/TuRutinaSheet.tsx'
import { RestDayCard } from '../../components/RestDayCard.tsx'
import { WeekCard } from '../../components/WeekCard.tsx'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { encuadreDe, fotoDeTarjeta } from '../../state/fotos.ts'
import { EditarRutinaHoja } from '../editar-rutina/EditarRutinaHoja.tsx'
import { addDays, localDate } from '../../../../shared/lib/format.ts'
import {
  descansasHoy,
  detalleCorto,
  entrenos,
  seriesPorMusculo,
  sesiones as sesionesPlan,
  tocaHoy,
  tonoDe,
  tuSemana,
  type Tono,
} from '../../state/plan.ts'
import { MUSCLE_IDS, MUSCLES } from '../../state/routines.ts'
import { consejosEntrenador, informeEntrenador, semanaEntrenador } from '../../state/entrenador.ts'
import { sesionEnCurso } from '../../state/sesionEnCurso.ts'
import {
  aplicarConsejo,
  aplicarParon,
  cargarEntrenador,
  dejarConsejo,
  dejarParon,
  deshacerParon,
  noMeInteresa,
} from '../../use-cases/entrenador.ts'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { FinDeRutinaCard } from '../../components/FinDeRutinaCard.tsx'
import { finDeRutina } from '../../state/finDeRutina.ts'
import { quitarFinDeRutina } from '../../use-cases/finDeRutina.ts'
import { repetirRutina } from '../../use-cases/mesocycles.ts'
import { SinPlan } from '../comun/SinPlan.tsx'
import { usePlan } from '../comun/usePlan.ts'
import styles from './TuPlanScreen.module.css'

const NOMBRES = Object.fromEntries(Object.entries(MUSCLES).map(([id, m]) => [id, m.label]))

type Periodo = 'hoy' | 'semana'

/** Tu plan (pestaña Entreno): la sesión que toca, «Empezar», tu semana y los músculos. */
export function TuPlanScreen() {
  const plan = usePlan()
  if (plan.status === 'loading') return null
  if (plan.status === 'none') return <SinPlan />
  return <TuPlan siguiente={plan.rotacion.siguiente} programId={plan.programId} />
}

/** Tu plan ya cargado (aparte, para que el carrusel y la barra se enganchen a lo que ya está pintado). */
function TuPlan({ siguiente, programId }: { siguiente: number; programId: string }) {
  const sheet = useSheet('rutina')
  const biblioteca = useSheet('biblioteca')
  const editar = useSheet('editar')
  // Desde «Tu entrenador», Editar rutina se abre con ese músculo señalado (?hoja=editar&m=hombro_lat)
  const { query, route } = useLocation()
  // Al bajar, la cabecera grande se va y arriba queda una barra con el título (como en las listas de rutinas)
  const cabecera = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(0)
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [lado, setLado] = useState<'front' | 'back'>('front')
  const [musculo, setMusculo] = useState<string | null>(null)
  useEffect(() => {
    void cargarEntrenador()
  }, [])
  // El aviso de abajo (el parón aplicado, con «Deshacer»)
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: () => void } | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(t)
  }, [aviso])
  const paron = semanaEntrenador.value?.paron ?? null
  // Hoy toca descanso, pero quieres entrenar: vuelven las sesiones y «Empezar»
  const [entrenarIgual, setEntrenarIgual] = useState(false)

  const hoy = localDate()
  const fin = finDeRutina.value
  const toca = tocaHoy.value
  // Un descanso obligatorio de tu rutina: hoy sale como descanso y la sesión que toca, como la siguiente
  const descansa = descansasHoy(hoy)
  const semana = tuSemana(hoy)
  const hechas = new Set(semana.filter((d) => d.estado === 'hecho').map((d) => d.sigla))
  // Si ya entrenaste hoy (usuario, 2026-11-23), la siguiente sesión no es de hoy: es de mañana (o la siguiente si mañana
  // descansas). Hoy se queda con la que hiciste
  const enCurso = sesionEnCurso.value?.sigla
  const hechaHoy = entrenos.value.filter((x) => x.fecha === hoy).sort((a, b) => b.inicio - a.inicio)[0]?.sigla
  const todas = sesionesPlan.value.map((s) => ({
    ...s,
    tono: tonoDe(s.sigla),
    detalle: detalleCorto(s),
    // A medias (la dejaste para seguir luego, usuario 2026-11-23): «Seguir»; hecha hoy, sin «Empezar»
    accion: (s.sigla === enCurso ? 'seguir' : s.sigla === hechaHoy ? null : 'empezar') as
      'empezar' | 'seguir' | null,
    estado:
      s.sigla === enCurso
        ? 'A medias'
        : s.sigla === hechaHoy
          ? 'Hecha hoy'
          : hechas.has(s.sigla)
            ? 'Hecha'
            : s.sigla === toca?.sigla
              ? hechaHoy
                ? descansasHoy(addDays(hoy, 1))
                  ? 'Siguiente'
                  : 'Mañana'
                : descansa
                  ? 'Siguiente'
                  : 'Hoy'
              : 'Pendiente',
  }))
  // La primera tarjeta es la de hoy (la que toca o la que ya hiciste); detrás, las que siguen en el ciclo
  const hechaHoyEn = hechaHoy ? todas.findIndex((s) => s.sigla === hechaHoy) : -1
  const deHoy = hechaHoyEn >= 0 ? hechaHoyEn : Math.max(0, siguiente)
  const sesiones = [...todas.slice(deHoy), ...todas.slice(0, deHoy)]
  const series = seriesPorMusculo(entrenos.value, hoy, toca)[periodo]
  const trabajados = Object.entries(series).filter(([, n]) => n > 0)
  const actividad = {
    musculos: trabajados.length,
    series: trabajados.reduce((n, [, x]) => n + x, 0),
    porMusculo: Object.fromEntries(trabajados) as Record<string, number>,
  }
  return (
    <>
      <CompactBar title="Entrenamiento" watch={cabecera} />
      <div ref={cabecera}>
        <ScreenHeader
          title="Entrenamiento"
          avatarHref={paths.profile}
          inline
          action={
            <button type="button" class={styles.settings} onClick={sheet.show}>
              <PencilIcon />
              Editar
            </button>
          }
        />
      </div>
      {/* Terminaste tu rutina (usuario, 2026-11-23): hasta que eliges, arriba */}
      {fin && fin.programId === programId && (
        <div class={styles.fin}>
          <FinDeRutinaCard
            titulo="Terminaste tu rutina"
            texto={`${fin.semanas} semanas de ${fin.rutina}. Si la repites, empieza una etapa nueva y verás cada semana frente a la misma de tu vuelta anterior.`}
            onRepetir={() =>
              void repetirRutina(hoy).then((ok) =>
                setAviso({ texto: ok ? 'Empiezas otra vuelta: semana 1' : 'No se pudo: inténtalo otra vez' }),
              )
            }
            hrefCambiar={paths.chooseRoutine}
            onAhoraNo={() => void quitarFinDeRutina()}
          />
        </div>
      )}
      {descansa && !entrenarIgual ? (
        <RestDayCard
          siguiente={toca ? `${toca.sigla} · ${toca.nombre}` : null}
          onEntrenar={() => setEntrenarIgual(true)}
        />
      ) : (
        <Carrusel sesiones={sesiones} visible={visible} onVisible={setVisible} />
      )}

      <div class={styles.blocks}>
        <WeekCard dias={semana} total={sesionesPlan.value.length} />
        <CoachCard
          consejos={consejosEntrenador.value}
          informe={informeEntrenador.value}
          hrefRecarga={paths.nutritionTarget}
          onParon={
            paron
              ? {
                  aplicar: () =>
                    void aplicarParon(paron.vuelta).then((hechos) =>
                      setAviso({
                        texto: 'Una serie menos por músculo',
                        deshacer: () => void deshacerParon(paron.vuelta, hechos).then(() => setAviso(null)),
                      }),
                    ),
                  dejar: () => void dejarParon(paron.vuelta),
                }
              : null
          }
          onAplicar={(c, a) => void aplicarConsejo(c, a)}
          onDejar={(c) => void dejarConsejo(c)}
          onNoMeInteresa={(c) => void noMeInteresa(c)}
          onEditar={(c) => editar.showWith({ m: c.musculo })}
          onEditarMusculo={(m) => editar.showWith({ m })}
        />
        <MusclesCard
          periodo={periodo}
          onPeriodo={setPeriodo}
          lado={lado}
          onLado={(l) => {
            setLado(l)
            setMusculo(null)
          }}
          musculo={musculo}
          onMusculo={setMusculo}
          musculos={actividad.musculos}
          series={actividad.series}
          porMusculo={actividad.porMusculo}
          names={NOMBRES}
          onFicha={(m) => {
            setMusculo(null)
            route(paths.muscle(m))
          }}
        />
      </div>
      {sheet.open && (
        <TuRutinaSheet
          onClose={sheet.close}
          acciones={{
            biblioteca: biblioteca.showInstead,
            editar: editar.showInstead,
          }}
        />
      )}
      {biblioteca.open && <BibliotecaHoja onClose={biblioteca.close} />}
      {/* Solo mientras hay aviso: las hojas (Editar rutina) y la burbuja de un músculo traen el suyo */}
      {aviso && (
        <Toast
          message={aviso.texto}
          action={aviso.deshacer ? { label: 'Deshacer', onClick: aviso.deshacer } : null}
        />
      )}
      {editar.open && (
        <EditarRutinaHoja musculo={MUSCLE_IDS.find((m) => m === query.m) ?? null} onClose={editar.close} />
      )}
    </>
  )
}

type Tarjeta = {
  sigla: string
  nombre: string
  detalle: string
  estado: string
  tono: Tono
  accion: 'empezar' | 'seguir' | null
}

/** Las tarjetas de las sesiones, que se deslizan con el dedo (y se arrastran con el ratón), sin flechas; y sus puntos. */
function Carrusel(props: { sesiones: Tarjeta[]; visible: number; onVisible: (i: number) => void }) {
  const carrusel = useDragScroll<HTMLDivElement>()
  return (
    <>
      <div
        ref={carrusel}
        class={styles.cards}
        role="group"
        aria-label="Sesiones de tu rutina"
        onScroll={(event) =>
          props.onVisible(Math.round(event.currentTarget.scrollLeft / carouselStep(event.currentTarget)))
        }
      >
        {props.sesiones.map((s) => (
          <div key={s.sigla} class={styles.card}>
            <SessionCard
              sigla={s.sigla}
              nombre={s.nombre}
              detalle={s.detalle}
              estado={s.estado}
              tono={s.tono}
              foto={fotoDeTarjeta(s.sigla)}
              encuadre={encuadreDe(s.sigla)}
              accion={s.accion}
              href={s.estado === 'Hecha hoy' ? paths.progressDay(localDate()) : undefined}
            />
          </div>
        ))}
      </div>
      <div class={styles.dots} aria-hidden="true">
        {props.sesiones.map((s, i) => (
          <span key={s.sigla} class={`${styles.dot} ${i === props.visible ? styles.current : ''}`} />
        ))}
      </div>
    </>
  )
}
