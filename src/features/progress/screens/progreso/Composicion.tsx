import { formatDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import {
  ajustesCuerpo,
  comida,
  composicion,
  NECESARIAS,
  OBJETIVOS_GRASA,
  PERIMETROS,
  pesoActual,
  pesoConGrasa,
  resumen,
  semanasHasta,
} from '../../state/progreso.ts'
import { elegirObjetivoGrasa } from '../../use-cases/progress.ts'
import propios from './Composicion.module.css'
import styles from './Progreso.module.css'

/** El círculo va del 5 al 40 % de grasa (tres cuartos de vuelta). */
const fraccion = (pct: number) => Math.min(1, Math.max(0, (pct - 5) / 35))
const VUELTA = 0.75

/**
 * Tu % de grasa en un círculo de tres cuartos (como en el prototipo anterior), con el punto de tu objetivo; al lado, masa
 * magra, grasa y FFMI. Sin datos, «—».
 */
function Anillo(props: {
  grasa: number | null
  objetivo: number | null
  magraKg: number | null
  grasaKg: number | null
  ffmi: number | null
}) {
  const lleno = props.grasa === null ? 0 : fraccion(props.grasa) * VUELTA * 100
  // El punto del objetivo, sobre el círculo (empieza abajo a la izquierda, a 135°)
  const angulo = props.objetivo === null ? null : ((135 + fraccion(props.objetivo) * 270) * Math.PI) / 180
  const dato = (n: number | null, unidad = '') => (n === null ? '—' : `${formatDecimal(n)}${unidad}`)
  return (
    <div class={propios.composicion}>
      <div
        class={propios.anillo}
        role="img"
        aria-label={
          props.grasa === null ? 'Grasa sin estimar' : `${formatDecimal(props.grasa)} % de grasa estimada`
        }
      >
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle
            class={propios.anilloBase}
            cx="66"
            cy="66"
            r="56"
            pathLength={100}
            style={{ strokeDasharray: `${VUELTA * 100} 100` }}
          />
          {lleno > 0 && (
            <circle
              class={propios.anilloLleno}
              cx="66"
              cy="66"
              r="56"
              pathLength={100}
              style={{ strokeDasharray: `${lleno} 100` }}
            />
          )}
        </svg>
        {angulo !== null && (
          <span
            class={propios.anilloObjetivo}
            style={{
              left: `${(50 + (56 / 1.32) * Math.cos(angulo)).toFixed(1)}%`,
              top: `${(50 + (56 / 1.32) * Math.sin(angulo)).toFixed(1)}%`,
            }}
          />
        )}
        <span class={propios.anilloCentro}>
          <b>{dato(props.grasa)}</b>
          <span>% de grasa</span>
        </span>
      </div>
      <dl class={propios.datos}>
        <div>
          <dt>Masa magra</dt>
          <dd>{dato(props.magraKg, ' kg')}</dd>
        </div>
        <div>
          <dt>Grasa</dt>
          <dd>{dato(props.grasaKg, ' kg')}</dd>
        </div>
        <div>
          <dt>FFMI</dt>
          <dd>{dato(props.ffmi)}</dd>
        </div>
      </dl>
    </div>
  )
}

type Props = { onCalibrar: () => void; onMedir: () => void; avisar: (texto: string) => void }

/**
 * Tu composición estimada (fórmula de la Marina con tus medidas y tu peso de tendencia): % de grasa con su rango, masa
 * magra, grasa y FFMI; tu objetivo de grasa con el peso que tendrías (la evolución, en su gráfica). Calibrar con una medida real.
 */
export function Composicion({ onCalibrar, onMedir, avisar }: Props) {
  const cuerpo = comida.value?.cuerpo
  const c = composicion.value
  const titulo = (
    <h2 id="progreso-composicion" class={styles.eti}>
      Composición
    </h2>
  )
  if (!cuerpo || !pesoActual.value || !c) {
    const faltan = cuerpo
      ? NECESARIAS[cuerpo.sexo]
          .filter((id) => !resumen.value[id])
          .map((id) => PERIMETROS.find((p) => p.id === id)?.nombre.toLowerCase())
      : []
    return (
      <section class={styles.card} aria-labelledby="progreso-composicion">
        {titulo}
        <Anillo grasa={null} objetivo={null} magraKg={null} grasaKg={null} ffmi={null} />
        <p class={styles.sub}>
          {!cuerpo || !pesoActual.value
            ? 'Para estimar tu grasa hacen falta tu sexo y tu altura (Tus datos, en Nutrición) y tu peso de tendencia.'
            : faltan.length
              ? `Para estimar tu grasa falta medir: ${faltan.join(', ')}.`
              : 'Con estas medidas la fórmula no da: revisa el cuello y la cintura.'}
        </p>
        {!cuerpo || !pesoActual.value ? (
          <a class={styles.accion} href={paths.nutrition}>
            Ir a Nutrición <ChevronRightIcon />
          </a>
        ) : (
          <button type="button" class={styles.accion} onClick={onMedir}>
            <PlusIcon /> Medirme
          </button>
        )}
      </section>
    )
  }
  const opciones = OBJETIVOS_GRASA[cuerpo.sexo]
  const objetivo = ajustesCuerpo.value.objetivo
  const peso = pesoActual.value
  const aObjetivo = objetivo ? pesoConGrasa(c.magraKg, objetivo) : null
  const ritmo = comida.value?.ritmo?.pctSemana ?? null
  const semanas = aObjetivo && ritmo !== null ? semanasHasta(peso, aObjetivo, ritmo) : null
  return (
    <section class={styles.card} aria-labelledby="progreso-composicion">
      <div class={styles.cabecera}>
        {titulo}
        {c.calibrado && <span class={styles.nota}>Calibrada</span>}
      </div>
      <Anillo grasa={c.grasa} objetivo={objetivo} magraKg={c.magraKg} grasaKg={c.grasaKg} ffmi={c.ffmi} />
      <p class={styles.nota}>
        Rango probable{' '}
        <b>
          {formatDecimal(c.rango[0])}–{formatDecimal(c.rango[1])} %
        </b>
        {objetivo ? ` · el punto del círculo es tu objetivo (${objetivo} %)` : ''}
      </p>

      <h3 class={styles.subtitulo}>Tu objetivo de grasa</h3>
      <ChoiceSegmented<string>
        name="objetivo-grasa"
        legend="Tu objetivo de grasa"
        options={opciones.map((o) => ({ value: String(o), label: `${o} %` }))}
        value={objetivo ? String(objetivo) : ''}
        onChange={(v) => {
          void elegirObjetivoGrasa(Number(v))
          avisar(`Tu objetivo: ${v} % de grasa`)
        }}
      />
      {objetivo && aObjetivo !== null && (
        <p class={styles.sub}>
          {c.grasa <= objetivo ? (
            <>Ya estás en tu objetivo ({objetivo} %).</>
          ) : (
            <>
              A un {objetivo} % pesarías unos <b>{formatDecimal(aObjetivo)} kg</b> conservando tu músculo: te
              quedan unos {formatDecimal(Math.round((peso - aObjetivo) * 10) / 10)} kg de grasa por perder
              {semanas ? `; a tu ritmo, unas ${semanas} semanas` : ''}.
            </>
          )}
        </p>
      )}

      <p class={`${styles.nota} ${styles.justificado}`}>
        Fórmula de la Marina de EE. UU. con tus medidas y tu peso de tendencia ({formatDecimal(peso)} kg):
        ±3–4 puntos de error. Se recomienda fiarse de la tendencia, no de una cifra suelta.
        {cuerpo.sexo === 'hombre' &&
          ' El FFMI va corregido a 1,80 m; en hombres naturales se suele citar ~25 como techo.'}
      </p>
      <button type="button" class={styles.accion} onClick={onCalibrar}>
        {c.calibrado ? 'Cambiar la calibración' : 'Calibrar con una medida real'} <ChevronRightIcon />
      </button>
    </section>
  )
}
