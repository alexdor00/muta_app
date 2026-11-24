import { useEffect } from 'preact/hooks'
import { formatChange, formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { EstaSemana, Informe, TarjetaInforme, type FilaInforme } from '../../../../shared/ui/Informe.tsx'
import { cargarCuerpo } from '../../use-cases/nutritionStore.ts'
import { ajustes, pendiente } from '../../state/comida.ts'
import {
  consejosSemana,
  cuerpoProgreso,
  FUERZA_BAJA,
  fuerzaBasicos,
  recargaPropuesta,
  revisionDeHoy,
} from '../../state/entrenador.ts'
import { resumenRevision, type Resumen } from './textoRevision.ts'
import { descartarRecarga, empezarRecarga } from '../../use-cases/target.ts'
import styles from './Objetivo.module.css'

/**
 * Qué dice hoy la revisión semanal, como un informe (`shared/ui/Informe`, el mismo que el entrenador de Entreno): estado,
 * titular, cifras y una recomendación. Con tu fuerza en los básicos (usuario, 2026-11-23: «si mantienes marcas y bajas
 * peso, vas bien; si bajan demasiado, cuidado»).
 */
export function RevisionCard({ onVer, historial }: { onVer: (() => void) | null; historial?: string }) {
  // Lo que apuntaste en Hoy (cómo estás, tus medidas) llega a la revisión al abrirla, sin recargar la app
  useEffect(() => void cargarCuerpo(), [])
  const p = pendiente.value
  const fase = ajustes.value?.fase ?? null
  const r = revisionDeHoy.value
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
    : resumenRevision(r, fase)
  const f = fuerzaBasicos.value
  // Mantener tus marcas mientras bajas es ir bien; si caen de más (−3 %), la revisión ya propone comer más
  const mantienes = f !== null && f > FUERZA_BAJA
  const filas: FilaInforme[] = [
    ...base.datos.map(([etiqueta, valor]) => ({ etiqueta, valor })),
    ...(f !== null && !base.datos.some(([k]) => k.startsWith('Fuerza'))
      ? [
          {
            etiqueta: 'Fuerza en los básicos',
            valor: Math.abs(f) < 0.005 ? 'Estable' : formatChange(f, 0),
            bien: f > 0,
          },
        ]
      : []),
    ...(semanas ? [{ etiqueta: 'Hasta tu objetivo de grasa', valor: `~${semanas} semanas` }] : []),
  ]
  const nota =
    !p && r?.tipo === 'bien' && fase === 'definicion' && mantienes
      ? 'Bajas de peso y mantienes tus marcas: vas bien.'
      : base.nota
  const recarga = recargaPropuesta.value
  return (
    <TarjetaInforme id="revision" rotulo="Revisión semanal">
      <Informe estado={base.estado} destacado={!!p} titulo={base.titulo} filas={filas} nota={nota} />
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
      <EstaSemana lineas={consejosSemana.value} />
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
    </TarjetaInforme>
  )
}
