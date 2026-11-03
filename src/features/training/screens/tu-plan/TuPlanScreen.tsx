import { useRef, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { DotsIcon, PlayIcon } from '../../../../shared/ui/icons.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { carouselStep, useDragScroll } from '../../../../shared/ui/useDragScroll.ts'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { MusclesCard } from '../../components/MusclesCard.tsx'
import { SessionCard } from '../../components/SessionCard.tsx'
import { TuRutinaSheet } from '../../components/TuRutinaSheet.tsx'
import { WeekCard } from '../../components/WeekCard.tsx'
import { BibliotecaHoja } from '../biblioteca/BibliotecaHoja.tsx'
import { MusculoHoja } from '../musculo/MusculoHoja.tsx'
import { localDate } from '../../../../shared/lib/format.ts'
import {
  detalleSesion,
  entrenos,
  semanaDe,
  seriesPorMusculo,
  sesiones as sesionesPlan,
  tocaHoy,
  tonoDe,
} from '../../state/plan.ts'
import { MUSCLES, type MuscleId } from '../../state/routines.ts'
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
  // Al bajar, la cabecera grande se va y arriba queda una barra con el título (como en las listas de rutinas)
  const cabecera = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(0)
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [lado, setLado] = useState<'front' | 'back'>('front')
  const [musculo, setMusculo] = useState<string | null>(null)
  const [ficha, setFicha] = useState<MuscleId | null>(null)
  // Con el dedo se desliza; con el ratón, se arrastra
  const carrusel = useDragScroll<HTMLDivElement>()

  const hoy = localDate()
  const toca = tocaHoy.value
  const semana = semanaDe(entrenos.value, hoy, toca?.sigla ?? '')
  const hechas = new Set(semana.filter((d) => d.estado === 'hecho').map((d) => d.sigla))
  const todas = sesionesPlan.value.map((s) => ({
    ...s,
    tono: tonoDe(s.sigla),
    detalle: detalleSesion(s),
    estado: hechas.has(s.sigla) ? 'Hecha' : s.sigla === toca?.sigla ? 'Hoy' : 'Pendiente',
  }))
  // La primera tarjeta es la que toca; detrás, las que siguen en el ciclo
  const deHoy = Math.max(0, siguiente)
  const sesiones = [...todas.slice(deHoy), ...todas.slice(0, deHoy)]
  // «Empezar» va con la sesión que se ve en el carrusel
  const elegida = sesiones[visible]?.sigla ?? toca?.sigla ?? ''
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
        <ScreenHeader title="Entrenamiento" avatarHref={paths.profile} inline />
      </div>
      <div
        ref={carrusel}
        class={styles.cards}
        role="group"
        aria-label="Sesiones de tu rutina"
        onScroll={(event) =>
          setVisible(Math.round(event.currentTarget.scrollLeft / carouselStep(event.currentTarget)))
        }
      >
        {sesiones.map((s) => (
          <div key={s.sigla} class={styles.card}>
            <SessionCard
              sigla={s.sigla}
              nombre={s.nombre}
              detalle={s.detalle}
              estado={s.estado}
              tono={s.tono}
            />
          </div>
        ))}
      </div>
      <div class={styles.dots} aria-hidden="true">
        {sesiones.map((s, i) => (
          <span key={s.sigla} class={`${styles.dot} ${i === visible ? styles.current : ''}`} />
        ))}
      </div>

      <div class={styles.actions}>
        <div class={styles.start}>
          <Button href={paths.session(elegida.toLowerCase())}>
            <span class={styles.startLabel}>
              <PlayIcon />
              Empezar {elegida}
            </span>
          </Button>
        </div>
        <button type="button" class={styles.more} aria-label="Tu rutina" onClick={sheet.show}>
          <DotsIcon />
        </button>
      </div>

      <div class={styles.blocks}>
        <WeekCard dias={semana} total={sesionesPlan.value.length} />
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
      {sheet.open && <TuRutinaSheet onClose={sheet.close} onBiblioteca={biblioteca.showInstead} />}
      {biblioteca.open && <BibliotecaHoja onClose={biblioteca.close} />}
      {ficha && <MusculoHoja musculo={ficha} onClose={() => setFicha(null)} />}
    </>
  )
}
