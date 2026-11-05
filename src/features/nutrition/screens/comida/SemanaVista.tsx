import {
  addDays,
  daysBetween,
  formatDecimal,
  formatInt,
  formatShortDate,
} from '../../../../shared/lib/format.ts'
import { CheckIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { TrendChart } from '../../components/TrendChart.tsx'
import { WeekBars } from '../../components/WeekBars.tsx'
import { hoy, letraDia, objetivoHoy, ritmoHoy, semana, serie } from '../../state/comida.ts'
import styles from './Vistas.module.css'

/** Semana: la media de los 7 últimos días frente a tu objetivo, los días con la proteína hecha y tu peso. */
export function SemanaVista({ onPesarme }: { onPesarme: () => void }) {
  const s = semana.value
  const objetivo = objetivoHoy.value
  if (!s || !objetivo) return null
  const desde = addDays(hoy.value, -13)
  const puntos = serie.value.filter((p) => p.date >= desde)
  const ritmo = ritmoHoy.value
  const actual = serie.value.at(-1)
  return (
    <div class={styles.stack}>
      <section class={styles.card} aria-labelledby="semana-kcal">
        <div class={styles.cardHead}>
          <h2 id="semana-kcal" class={styles.eyebrow}>
            Últimos 7 días
          </h2>
          <span class={styles.foot}>
            {formatShortDate(s.dias[0].date)} – {formatShortDate(hoy.value)}
          </span>
        </div>
        {s.media === null ? (
          <p class={styles.sub}>Cuando apuntes un día entero verás aquí tu media frente al objetivo.</p>
        ) : (
          <p class={styles.figure}>
            <span class={styles.number}>{formatInt(s.media)}</span>
            <span class={styles.sub}>
              kcal de media · <b>{Math.round((s.cumplido ?? 0) * 100)} %</b> del objetivo
            </span>
          </p>
        )}
        <WeekBars
          dias={s.dias.map((d) => ({ letra: letraDia(d.date), kcal: d.kcal, hoy: d.hoy }))}
          objetivo={objetivo.kcal}
        />
      </section>

      <section class={styles.card} aria-labelledby="semana-proteina">
        <div class={styles.cardHead}>
          <h2 id="semana-proteina" class={styles.eyebrow}>
            Proteína
          </h2>
          <span class={styles.sub}>
            <b>
              {s.conProteina} de {s.contados}
            </b>{' '}
            días con {formatInt(objetivo.protein)} g
          </span>
        </div>
        <ol class={styles.dots}>
          {s.dias.map((d) => {
            const hecho = d.apuntado && d.protein >= objetivo.protein
            return (
              <li key={d.date} class={styles.dayDot}>
                <span
                  role="img"
                  class={`${styles.dot} ${d.hoy ? styles.dotToday : hecho ? styles.dotDone : ''}`}
                  aria-label={`${letraDia(d.date)}: ${d.hoy ? 'hoy' : hecho ? 'proteína hecha' : d.apuntado ? 'faltó proteína' : 'sin apuntar'}`}
                >
                  {d.hoy ? Number(d.date.slice(8)) : hecho ? <CheckIcon /> : '—'}
                </span>
                <span class={d.hoy ? styles.todayLetter : styles.letter} aria-hidden="true">
                  {d.hoy ? 'HOY' : letraDia(d.date)}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <section class={styles.card} aria-labelledby="semana-peso">
        <div class={styles.cardHead}>
          <h2 id="semana-peso" class={styles.eyebrow}>
            Tu peso · tendencia
          </h2>
          <button type="button" class={styles.small} onClick={onPesarme}>
            <PlusIcon /> Pesarme
          </button>
        </div>
        {actual ? (
          <p class={styles.figure}>
            <span class={styles.number}>{formatDecimal(Math.round(actual.tendencia * 10) / 10)}</span>
            <span class={styles.sub}>
              kg
              {ritmo && (
                <>
                  {' · '}
                  <b>
                    {ritmo.kgSemana > 0 ? '+' : ritmo.kgSemana < 0 ? '−' : ''}
                    {formatDecimal(Math.abs(ritmo.kgSemana))} kg
                  </b>{' '}
                  por semana
                </>
              )}
            </span>
          </p>
        ) : (
          <p class={styles.sub}>
            Pésate en ayunas, a poder ser cada día: la tendencia suaviza el agua del día a día.
          </p>
        )}
        {puntos.length > 1 && (
          <>
            <TrendChart
              puntos={puntos.map((p) => ({
                dia: daysBetween(desde, p.date),
                kg: p.kg,
                tendencia: p.tendencia,
              }))}
              dias={14}
              desde={formatShortDate(desde)}
              hasta={formatShortDate(hoy.value)}
              resumen={`Tendencia de tu peso en 14 días: de ${formatDecimal(puntos[0].tendencia)} a ${formatDecimal(puntos.at(-1)?.tendencia ?? 0)} kg`}
            />
            <p class={styles.foot}>● pesajes · — tendencia (suaviza el agua del día a día)</p>
          </>
        )}
      </section>
    </div>
  )
}
