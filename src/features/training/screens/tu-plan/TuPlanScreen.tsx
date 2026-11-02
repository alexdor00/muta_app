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
import { actividadMuestra, detalleSesion, MUESTRA, tonoDe, type Periodo } from '../../state/muestra/datos.ts'
import { MUSCLES } from '../../state/routines.ts'
import styles from './TuPlanScreen.module.css'

const ESTADO = { hecho: 'Hecha', hoy: 'Hoy', pendiente: 'Pendiente', descanso: 'Descanso' } as const
/** Cada sesión con su color fijo (por su orden en la rutina) y cómo va esta semana. */
const TARJETAS = MUESTRA.sesiones.map((s) => ({
  ...s,
  tono: tonoDe(s.sigla),
  detalle: detalleSesion(s),
  estado: ESTADO[MUESTRA.semana.find((d) => d.sigla === s.sigla)?.estado ?? 'pendiente'],
}))

const NOMBRES = Object.fromEntries(Object.entries(MUSCLES).map(([id, m]) => [id, m.label]))

/** Tu plan (pestaña Entreno): la sesión de hoy, «Empezar», tu semana y los músculos. Datos de prueba (state/muestra/). */
export function TuPlanScreen() {
  const sheet = useSheet('rutina')
  // Al bajar, la cabecera grande se va y arriba queda una barra con el título (como en las listas de rutinas)
  const cabecera = useRef<HTMLDivElement>(null)
  const hoy = MUESTRA.semana.find((d) => d.estado === 'hoy')?.sigla ?? MUESTRA.sesiones[0].sigla
  // La primera tarjeta es la de hoy; detrás, las que siguen en el ciclo
  const deHoy = Math.max(
    0,
    MUESTRA.sesiones.findIndex((s) => s.sigla === hoy),
  )
  const sesiones = [...TARJETAS.slice(deHoy), ...TARJETAS.slice(0, deHoy)]
  const [visible, setVisible] = useState(0)
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [lado, setLado] = useState<'front' | 'back'>('front')
  const [musculo, setMusculo] = useState<string | null>(null)
  // «Empezar» va con la sesión que se ve en el carrusel
  const elegida = sesiones[visible]?.sigla ?? hoy
  const actividad = actividadMuestra(periodo)
  // Con el dedo se desliza; con el ratón, se arrastra
  const carrusel = useDragScroll<HTMLDivElement>()
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
          <Button href={paths.sessionStart(elegida.toLowerCase())}>
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
        <WeekCard dias={MUESTRA.semana} />
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
        />
      </div>
      {sheet.open && <TuRutinaSheet onClose={sheet.close} />}
    </>
  )
}
