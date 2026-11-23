import { formatDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronDownIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import type { DetalleMeso, SerieHecha } from '../../../training/index.ts'
import { fotosRutina } from '../../state/progreso.ts'
import { textoSerie } from '../progreso/formato.ts'
import styles from '../progreso/Progreso.module.css'
import propios from './Mesociclo.module.css'

const t1 = (n: number) => formatDecimal(Math.round(n * 10) / 10)
const pct = (v: number, max: number) => `${Math.min(100, Math.max(0, (v / max) * 100)).toFixed(1)}%`

/**
 * Constancia de una etapa: el % de lo planificado, tu racha y cada semana con un punto por sesión. Qué hiciste cada día,
 * en el calendario (justo debajo, en Progreso).
 */
export function Constancia({ d }: { d: DetalleMeso }) {
  const { constancia: c } = d
  return (
    <section class={styles.card} aria-labelledby="etapa-constancia">
      <h3 id="etapa-constancia" class={styles.eti}>
        Constancia
      </h3>
      {c.pct === null ? (
        <p class={styles.sub}>
          Cuando cierres la primera semana verás aquí cuánto de lo planificado has hecho.
        </p>
      ) : (
        <p class={styles.cifra}>
          <span class={styles.numero}>{c.pct} %</span>
          <span class={styles.sub}>
            <b>{c.veredicto}</b> · {c.hechas} de {c.planificadas} sesiones
          </span>
        </p>
      )}
      <ol class={styles.semanas} aria-label="Cada semana de la etapa: un punto por sesión" tabIndex={0}>
        {d.semanas.map((x) => (
          <li
            key={x.numero}
            class={styles.semana}
            aria-label={`Semana ${x.numero}: ${x.entrenos.length} ${x.entrenos.length === 1 ? 'sesión' : 'sesiones'}`}
          >
            <span class={styles.puntos} aria-hidden="true">
              {Array.from({ length: Math.max(d.porSemana, x.entrenos.length) }, (_, i) => (
                <i key={i} class={`${styles.puntito} ${i < x.entrenos.length ? styles.puntitoOn : ''}`} />
              ))}
            </span>
            S{x.numero}
          </li>
        ))}
      </ol>
      <p class={styles.nota}>
        Racha: {d.racha} {d.racha === 1 ? 'semana seguida' : 'semanas seguidas'} con {d.porSemana} sesiones o
        más. La semana en curso no cuenta hasta que termina. «Muy constante» desde el 85 % y «Constante» desde
        el 60 %, sugerido.
      </p>
    </section>
  )
}

const ESTADO = { ok: 'En rango', bajo: 'Corto', alto: 'Pasado', indirecto: 'Indirecto' } as const

/** Músculos: series directas por semana de cada músculo frente a su rango (las indirectas, aparte: no suman). */
export function Musculos({ d }: { d: DetalleMeso }) {
  if (!d.musculos)
    return (
      <section class={styles.card}>
        <p class={styles.sub}>Aún no hay sesiones en este mesociclo.</p>
      </section>
    )
  return (
    <>
      <p class={`${styles.nota} ${styles.justificado}`}>
        Series directas por semana frente a tu rango (el de la ficha de cada músculo). Las indirectas se ven
        aparte y no suman; la semana en curso aún no cuenta.
      </p>
      {d.musculos.map((g) => (
        <section key={g.grupo} class={styles.card} aria-label={g.grupo}>
          <div class={styles.cabecera}>
            <h2 class={styles.eti}>{g.grupo}</h2>
            <span class={styles.nota}>
              {g.enRango} de {g.filas.length} en rango
            </span>
          </div>
          <ul class={styles.lista}>
            {g.filas.map((x) => {
              const max = Math.max(x.rango[1] * 1.5, x.series * 1.1, 4)
              const sin = !x.series
              return (
                <li key={x.musculo} class={styles.fila}>
                  <span class={styles.filaTexto}>
                    <span class={styles.cabecera}>
                      <span class={styles.filaTitulo}>{x.nombre}</span>
                      <span class={styles.nota}>
                        {sin ? (x.indirectas ? 'Indirecto' : 'Sin series') : ESTADO[x.estado]}
                      </span>
                    </span>
                    <span
                      class={styles.rail}
                      role="img"
                      aria-label={`${t1(x.series)} series por semana; rango ${x.rango[0]}–${x.rango[1]}`}
                    >
                      <span
                        class={styles.zona}
                        style={{ left: pct(x.rango[0], max), width: pct(x.rango[1] - x.rango[0], max) }}
                      />
                      {!sin && <span class={styles.puntoRail} style={{ left: pct(x.series, max) }} />}
                    </span>
                    <span class={styles.filaDetalle}>
                      {sin
                        ? x.indirectas
                          ? `${t1(x.indirectas)} indirectas por semana · rango ${x.rango[0]}–${x.rango[1]}`
                          : `Rango ${x.rango[0]}–${x.rango[1]}`
                        : `${t1(x.series)} series · ${t1(x.veces)}× por semana · rango ${x.rango[0]}–${x.rango[1]}`}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}

/** «80 → 85 kg» de la primera a la última vez, o solo la última. */
function carga(primera: SerieHecha | null, ultima: SerieHecha | null, veces: number): string {
  if (!ultima) return ''
  if (!primera || veces < 2) return textoSerie(ultima)
  if (ultima.kg && primera.kg) return `${formatDecimal(primera.kg)} → ${formatDecimal(ultima.kg)} kg`
  return `${primera.reps} → ${ultima.reps} reps`
}

/**
 * Rutina: cada sesión del mesociclo, plegada: su foto (la de Editar rutina; sin ella, su color con la sigla), su nombre y
 * cuántas veces la hiciste; al abrirla, sus ejercicios con la carga de la primera y la última vez.
 */
export function Rutina({ d }: { d: DetalleMeso }) {
  if (!d.rutina.length)
    return (
      <section class={styles.card}>
        <p class={styles.sub}>No se guardó la rutina de este mesociclo.</p>
      </section>
    )
  return (
    <>
      <p class={styles.nota}>Tus sesiones en este mesociclo, con la carga de la primera y la última vez.</p>
      <ul class={propios.sesiones}>
        {d.rutina.map((s, i) => {
          const foto = fotosRutina.value[s.sigla]
          return (
            <li key={s.sigla}>
              <details class={propios.sesion}>
                <summary>
                  <span class={`${propios.miniatura} ${propios[`tono${(i % 4) + 1}`]}`} aria-hidden="true">
                    {foto ? <img src={foto} alt="" /> : s.sigla}
                  </span>
                  <span class={styles.filaTexto}>
                    <span class={styles.filaTitulo}>
                      {s.sigla} · {s.nombre}
                    </span>
                    <span class={styles.filaDetalle}>
                      {s.ejercicios.length} {s.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
                      {s.veces ? `hecha ${s.veces} ${s.veces === 1 ? 'vez' : 'veces'}` : 'sin hacer'}
                    </span>
                  </span>
                  <ChevronDownIcon />
                </summary>
                <ul class={styles.lista}>
                  {s.ejercicios.map((e) => {
                    const contenido = (
                      <>
                        <span class={styles.filaTexto}>
                          <span class={styles.filaTitulo}>{e.nombre}</span>
                          <span class={styles.filaDetalle}>{e.pauta}</span>
                        </span>
                        <span class={styles.valor}>{carga(e.primera, e.ultima, e.veces)}</span>
                        {e.ejercicioId && <ChevronRightIcon />}
                      </>
                    )
                    return (
                      <li key={e.nombre}>
                        {e.ejercicioId ? (
                          <a class={styles.fila} href={paths.exercise(e.ejercicioId)}>
                            {contenido}
                          </a>
                        ) : (
                          <span class={styles.fila}>{contenido}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </details>
            </li>
          )
        })}
      </ul>
    </>
  )
}
