import { formatDecimal, formatMonthName } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import type { EntrenoDelDia } from '../../../training/index.ts'
import { comida, entreno, hoy } from '../../state/progreso.ts'
import styles from './Progreso.module.css'

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const dos = (n: number) => String(n).padStart(2, '0')

/**
 * Días: tus entrenos del mes en una tarjeta como «Tu semana» de Entreno: cuántos y lo que moviste arriba y el calendario con
 * un círculo por día (el que entrenaste, negro con su sigla; hoy, con borde; los que aún no han llegado, más claros). Un día
 * con entreno lleva a su pantalla (`/progreso/dia/…`); uno sin entreno lo dice en un aviso.
 */
export function Dias({ mes, avisar }: { mes: string; avisar: (texto: string) => void }) {
  const [y, m] = mes.split('-').map(Number)
  const huecos = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const delMes = (entreno.value?.entrenos ?? []).filter((x) => x.fecha.startsWith(mes))
  const porDia = new Map<string, EntrenoDelDia[]>()
  for (const x of delMes) porDia.set(x.fecha, [...(porDia.get(x.fecha) ?? []), x])
  const toneladas = delMes.reduce((t, x) => t + x.toneladas, 0)
  const nombreMes = formatMonthName(mes).toLowerCase()
  // Los días de recarga de hidratos, con una «R» pequeña (usuario, 2026-11-22): por qué subió el peso esa semana
  const recarga = new Set(comida.value?.recarga ?? [])
  return (
    <section class={styles.semanaCard} aria-labelledby="dias-titulo">
      <div class={styles.semanaCab}>
        <h2 id="dias-titulo" class={styles.semanaEti}>
          Tus entrenos
        </h2>
        <p class={styles.semanaCuenta}>
          <strong>{delMes.length}</strong> {delMes.length === 1 ? 'entreno' : 'entrenos'}
          {delMes.length ? ` · ${formatDecimal(Math.round(toneladas * 10) / 10)} t` : ''}
        </p>
      </div>
      <ul class={styles.mesDias}>
        {LETRAS.map((l) => (
          <li key={l} class={styles.mesLetra} aria-hidden="true">
            {l}
          </li>
        ))}
        {Array.from({ length: huecos }, (_, i) => (
          <li key={`h${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: dias }, (_, i) => {
          const fecha = `${mes}-${dos(i + 1)}`
          const lista = porDia.get(fecha) ?? []
          const futuro = fecha > hoy.value
          return (
            <li key={fecha} class={recarga.has(fecha) ? styles.conRecarga : undefined}>
              {recarga.has(fecha) && (
                <span class={styles.marcaRecarga} title="Recarga de hidratos">
                  R
                </span>
              )}
              {lista.length ? (
                <a
                  class={`${styles.circuloDia} ${styles.hecho}`}
                  href={paths.progressDay(fecha)}
                  aria-label={`${i + 1} de ${nombreMes}, ${lista.map((x) => x.sigla).join(' y ')}`}
                >
                  {lista[0].sigla}
                </a>
              ) : futuro ? (
                <span class={`${styles.circuloDia} ${styles.futuro}`} aria-hidden="true">
                  {i + 1}
                </span>
              ) : (
                <button
                  type="button"
                  class={`${styles.circuloDia} ${fecha === hoy.value ? styles.esHoy : ''}`}
                  aria-label={`${i + 1} de ${nombreMes}`}
                  onClick={() =>
                    avisar(fecha === hoy.value ? 'Hoy aún no has entrenado' : 'Sin entreno ese día')
                  }
                >
                  {i + 1}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p class={styles.notaCentro}>
        {delMes.length ? 'Toca un entreno para ver lo que hiciste' : 'Sin entrenos este mes'}
        {[...recarga].some((x) => x.startsWith(mes)) ? ' · R: recarga de hidratos' : ''}
      </p>
    </section>
  )
}
