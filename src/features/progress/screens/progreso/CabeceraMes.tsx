import { formatMonthName } from '../../../../shared/lib/format.ts'
import { DayNav } from '../../../../shared/ui/DayNav.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import type { TarjetaMeso } from '../../../training/index.ts'
import { enEtapa, entreno, fuerzaDelMes, mesComoTramo, otroMes } from '../../state/progreso.ts'
import { cambioTexto, fechasDe, fuerzaTexto } from './formato.ts'
import styles from './Progreso.module.css'

type Props = {
  mes: string
  puedeAntes: boolean
  puedeDespues: boolean
  onMes: (mes: string) => void
  etapa: TarjetaMeso | null
  /** El % de constancia de ese mes en su etapa (null si no se sabe). */
  constancia: number | null
  onEtapa: () => void
}

/**
 * El mes, como el día de Nutrición: encima, «‹ Noviembre ›» con el año debajo (cambia el mes de toda la pantalla); en la
 * tarjeta, la etapa de ese mes en una píldora (abre su hoja) y tres cifras frente al mes anterior en cajitas: tu peso, tu
 * fuerza y tus sesiones (con el % de constancia del mes en su etapa).
 */
export function CabeceraMes({ mes, puedeAntes, puedeDespues, onMes, etapa, constancia, onEtapa }: Props) {
  const peso = enEtapa(mesComoTramo(mes)).cuerpo.find((f) => f.id === 'peso')
  const e = entreno.value
  const fuerza = fuerzaDelMes(
    (e?.fuerzaSemanal ?? []).map((s) => ({ date: s.lunes, cambio: s.cambio })),
    mes,
  )
  const sesiones = (e?.entrenos ?? []).filter((x) => x.fecha.startsWith(mes)).length
  const nombre = `${formatMonthName(mes)} ${mes.slice(0, 4)}`
  return (
    <>
      <DayNav
        titulo={formatMonthName(mes)}
        detalle={mes.slice(0, 4)}
        etiqueta={nombre}
        paso="Mes"
        onAntes={puedeAntes ? () => onMes(otroMes(mes, -1)) : null}
        onDespues={puedeDespues ? () => onMes(otroMes(mes, 1)) : null}
      />
      <section class={styles.card} aria-label={nombre}>
        {etapa ? (
          <button type="button" class={styles.etapaChip} onClick={onEtapa}>
            Etapa <b>{etapa.nombre}</b> ·{' '}
            {etapa.fin ? fechasDe(etapa) : `semana ${etapa.semana} de ${etapa.semanas}`}
            <ChevronRightIcon />
          </button>
        ) : (
          <p class={styles.notaCentro}>Sin etapa este mes</p>
        )}
        <ul
          class={`${styles.cajas} ${styles.cajas3} ${styles.cifrasMes}`}
          aria-label="Frente al mes anterior"
        >
          <li>
            <b>{peso?.cambio != null ? cambioTexto(peso.cambio, 'kg') : '—'}</b>
            tu peso
          </li>
          <li>
            <b>{fuerzaTexto(fuerza)}</b>
            tu fuerza
          </li>
          <li>
            <b>{sesiones}</b>
            {sesiones === 1 ? 'sesión' : 'sesiones'}
            {constancia !== null ? ` · ${constancia} %` : ''}
          </li>
        </ul>
      </section>
    </>
  )
}
