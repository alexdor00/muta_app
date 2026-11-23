import { formatInt } from '../../../../shared/lib/format.ts'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { DetalleMeso, TarjetaMeso } from '../../../training/index.ts'
import { enEtapa, entreno } from '../../state/progreso.ts'
import { AccionesEtapa } from './AccionesEtapa.tsx'
import { cambioTexto, fechasDe, fuerzaTexto } from './formato.ts'
import { FilaHoja } from './Piezas.tsx'
import styles from './Progreso.module.css'

type Props = {
  m: TarjetaMeso
  /** Su detalle (null mientras llega). */
  d: DetalleMeso | null
  onClose: () => void
  onConstancia: () => void
  onMusculos: () => void
  onRutina: () => void
  onComparar: () => void
}

/**
 * Tu etapa (desde «Etapa: … ›»): su nombre, sus fechas y su rutina; filas a tu constancia, tus músculos y tu rutina (con sus
 * fotos); tu comida de la etapa; lo que te dio desde que empezó; y lo que se hace con ella (y compararla con otra).
 */
export function EtapaHoja({ m, d, onClose, onConstancia, onMusculos, onRutina, onComparar }: Props) {
  const e = enEtapa({ desde: m.inicio, hasta: m.fin })
  const peso = e.cuerpo.find((f) => f.id === 'peso')
  const c = d?.constancia
  const otras = (entreno.value?.anteriores.length ?? 0) + (entreno.value?.mesoActual ? 1 : 0) > 1
  return (
    <Sheet title={m.nombre} onClose={onClose} large>
      <div class={styles.hoja}>
        <p class={styles.sub}>
          {fechasDe(m)} · {m.fin ? `${m.semanas} semanas` : `semana ${m.semana} de ${m.semanas}`} · {m.rutina}
        </p>
        <ul class={`${styles.cajas} ${styles.cajas3}`} aria-label="Desde que empezó">
          <li>
            Peso
            <b>{peso?.cambio != null ? cambioTexto(peso.cambio, 'kg') : '—'}</b>
            desde que empezó
          </li>
          <li>
            Fuerza
            <b>{fuerzaTexto(m.fuerza)}</b>
            en tus básicos
          </li>
          <li>
            Récords
            <b>{m.records}</b>
            {m.records === 1 ? 'nuevo' : 'nuevos'}
          </li>
        </ul>
        <ul class={styles.plana}>
          {d && c && (
            <FilaHoja
              titulo="Constancia"
              detalle={
                c.pct === null
                  ? 'Cada semana, un punto por sesión'
                  : `${c.pct} % · ${c.hechas} de ${c.planificadas} sesiones · racha de ${d.racha}`
              }
              onClick={onConstancia}
            />
          )}
          {d && (
            <FilaHoja
              titulo="Tus músculos"
              detalle="Series por semana frente a su rango"
              onClick={onMusculos}
            />
          )}
          {d && (
            <FilaHoja
              titulo="Tu rutina"
              detalle={`${d.rutina.length} sesiones, con sus fotos`}
              onClick={onRutina}
            />
          )}
        </ul>
        <section class={styles.card} aria-label="Tu comida en la etapa">
          {e.comida ? (
            <ul class={`${styles.cajas} ${styles.cajas3}`}>
              <li>
                Tu objetivo
                <b>{e.comida.objetivo ? `${formatInt(e.comida.objetivo)}` : '—'}</b>
                kcal al día
              </li>
              <li>
                Comiste
                <b>{formatInt(e.comida.kcal)}</b>
                kcal de media
              </li>
              <li>
                Proteína
                <b>{formatInt(e.comida.proteina)} g</b>
                al día
              </li>
            </ul>
          ) : (
            <p class={styles.sub}>Sin comida apuntada en esta etapa: se apunta en Nutrición.</p>
          )}
        </section>
        {d && <AccionesEtapa d={d} />}
        {otras && (
          <button type="button" class={styles.accion} onClick={onComparar}>
            Comparar con otra etapa
          </button>
        )}
      </div>
    </Sheet>
  )
}
