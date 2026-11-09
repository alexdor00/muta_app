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
import { fotosSesion } from '../../state/fotos.ts'
import { EditarRutinaHoja } from '../editar-rutina/EditarRutinaHoja.tsx'
import { MusculoHoja } from '../musculo/MusculoHoja.tsx'
import { localDate } from '../../../../shared/lib/format.ts'
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
import { MUSCLES, type MuscleId } from '../../state/routines.ts'
import { consejosEntrenador } from '../../state/entrenador.ts'
import { aplicarConsejo, cargarEntrenador, dejarConsejo } from '../../use-cases/entrenador.ts'
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
  return <TuPlan siguiente={plan.rotacion.siguiente} />
}

/** Tu plan ya cargado (aparte, para que el carrusel y la barra se enganchen a lo que ya está pintado). */
function TuPlan({ siguiente }: { siguiente: number }) {
  const sheet = useSheet('rutina')
  const biblioteca = useSheet('biblioteca')
  const editar = useSheet('editar')
  // Al bajar, la cabecera grande se va y arriba queda una barra con el título (como en las listas de rutinas)
  const cabecera = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(0)
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [lado, setLado] = useState<'front' | 'back'>('front')
  const [musculo, setMusculo] = useState<string | null>(null)
  const [ficha, setFicha] = useState<MuscleId | null>(null)
  useEffect(() => {
    void cargarEntrenador()
  }, [])
  // Hoy toca descanso, pero quieres entrenar: vuelven las sesiones y «Empezar»
  const [entrenarIgual, setEntrenarIgual] = useState(false)

  const hoy = localDate()
  const toca = tocaHoy.value
  // Un descanso obligatorio de tu rutina: hoy sale como descanso y la sesión que toca, como la siguiente
  const descansa = descansasHoy(hoy)
  const semana = tuSemana(hoy)
  const hechas = new Set(semana.filter((d) => d.estado === 'hecho').map((d) => d.sigla))
  const todas = sesionesPlan.value.map((s) => ({
    ...s,
    tono: tonoDe(s.sigla),
    detalle: detalleCorto(s),
    estado: hechas.has(s.sigla)
      ? 'Hecha'
      : s.sigla === toca?.sigla
        ? descansa
          ? 'Siguiente'
          : 'Hoy'
        : 'Pendiente',
  }))
  // La primera tarjeta es la que toca; detrás, las que siguen en el ciclo
  const deHoy = Math.max(0, siguiente)
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
          onAplicar={(c) => void aplicarConsejo(c)}
          onDejar={(c) => void dejarConsejo(c)}
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
            setFicha(m as MuscleId)
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
      {editar.open && <EditarRutinaHoja onClose={editar.close} />}
      {ficha && <MusculoHoja musculo={ficha} onClose={() => setFicha(null)} />}
    </>
  )
}

type Tarjeta = { sigla: string; nombre: string; detalle: string; estado: string; tono: Tono }

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
              foto={fotosSesion.value[s.sigla] ?? null}
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
