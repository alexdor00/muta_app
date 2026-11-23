import { useEffect } from 'preact/hooks'
import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { cargarCuerpo } from '../../use-cases/nutritionStore.ts'
import { ajustes, pendiente } from '../../state/comida.ts'
import { consejosSemana, cuerpoProgreso, recargaPropuesta, revisionDeHoy } from '../../state/entrenador.ts'
import { resumenRevision, type Resumen } from './textoRevision.ts'
import { descartarRecarga, empezarRecarga } from '../../use-cases/target.ts'
import styles from './Objetivo.module.css'

/** Qué dice hoy la revisión semanal, como un informe: estado, titular, cifras y una recomendación. */
export function RevisionCard({ onVer, historial }: { onVer: (() => void) | null; historial?: string }) {
  // Lo que apuntaste en Hoy (cómo estás, tus medidas) llega a la revisión al abrirla, sin recargar la app
  useEffect(() => void cargarCuerpo(), [])
  const p = pendiente.value
  const fase = ajustes.value?.fase ?? null
  // Las semanas que te quedan hasta tu objetivo de grasa, en definición (02-reglas § 8, «Peso objetivo»)
  const semanas = fase === 'definicion' ? cuerpoProgreso.value?.semanas : null
  const base: Resumen = p
    ? {
        estado: '1 sugerencia',
        titulo: p.texto,
        datos:
          p.a === p.de
            ? []
            : [
                ['Ahora', `${formatInt(p.de ?? 0)} kcal`],
                ['Propuesta', `${formatInt(p.a)} kcal`],
              ],
      }
    : resumenRevision(revisionDeHoy.value, fase)
  const datos = semanas
    ? [...base.datos, ['Hasta tu objetivo de grasa', `~${semanas} semanas`] as [string, string]]
    : base.datos
  const consejos = consejosSemana.value
  const recarga = recargaPropuesta.value
  return (
    <section class={styles.review} aria-labelledby="revision">
      <div class={styles.reviewHead}>
        <h2 id="revision" class={styles.reviewEyebrow}>
          Revisión semanal
        </h2>
        <span class={p ? styles.badge : styles.estado}>{base.estado}</span>
      </div>
      <p class={styles.reviewTitle}>{base.titulo}</p>
      {datos.length > 0 && (
        <dl class={styles.reviewDatos}>
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {base.nota && <p class={styles.foot}>{base.nota}</p>}
      {recarga && (
        <div class={styles.recarga}>
          <p class={styles.reviewEyebrow}>Recarga de hidratos</p>
          <p class={styles.foot}>
            Rendimiento a la baja. Hasta el {formatDayDate(recarga.hasta)}, mantenimiento los días de entreno.
          </p>
          <div class={styles.recargaBotones}>
            <button
              type="button"
              class={styles.see}
              onClick={() => void empezarRecarga(recarga.hasta, recarga.sesiones)}
            >
              Empezar la recarga
            </button>
            <button type="button" class={styles.textButton} onClick={() => void descartarRecarga()}>
              Ahora no
            </button>
          </div>
        </div>
      )}
      {consejos.length > 0 && (
        <div class={styles.reviewConsejos}>
          <p class={styles.reviewEyebrow}>Esta semana</p>
          <ul>
            {consejos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {p && onVer && (
        <button type="button" class={styles.see} onClick={onVer}>
          Ver la sugerencia
        </button>
      )}
      {historial && (
        // El historial va con la revisión: es lo que fue cambiando (usuario, 2026-11-19)
        <a class={styles.verHistorial} href={historial}>
          Ver el historial ›
        </a>
      )}
    </section>
  )
}
