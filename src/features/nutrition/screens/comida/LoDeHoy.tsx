import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { CheckIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { hoy } from '../../state/comida.ts'
import {
  fotos,
  huecosDelDia,
  manana,
  menu,
  paraCocinar,
  platoPorId,
  tareasDeHoy,
  totalDelHueco,
  type Hueco,
} from '../../state/recetas.ts'
import { platoApuntado } from '../../use-cases/recipes.ts'
import { comidaDe } from '../comun/platos.ts'
import styles from './Menu.module.css'
import v from './Vistas.module.css'

type Props = { onCocinado: (id: string) => void; onApuntar: (h: Hueco) => void }

/**
 * Lo de hoy, de tu menú: la compra y lo que cocinas (con su hora) y lo que comes, con «Apuntar». Debajo, lo de mañana que
 * sale de lo que cocinas. Hasta que exista la pestaña Hoy, va aquí.
 */
export function LoDeHoy({ onCocinado, onApuntar }: Props) {
  const tareas = tareasDeHoy.value
  if (!tareas.length) return null
  const m = menu.value
  const deManana = huecosDelDia(m, manana.value).filter((h) => h.cocinado)
  return (
    <section class={v.card} aria-labelledby="lo-de-hoy">
      <p id="lo-de-hoy" class={v.foot}>
        Tu nutricionista · lo de hoy
      </p>
      <ul class={styles.filas}>
        {tareas.map((t) => {
          if (t.tipo === 'compra')
            return (
              <li key={t.id}>
                <a class={styles.fila} href={paths.shopping}>
                  <span class={styles.cocinar}>{t.hora}</span>
                  <span class={styles.filaTexto}>
                    <span class={styles.plato}>Haz la compra</span>
                  </span>
                  <ChevronRightIcon />
                </a>
              </li>
            )
          if (t.tipo === 'cocinar') {
            const p = platoPorId(t.cocinado.plato)
            const principales = p
              ? paraCocinar(m, t.cocinado, p)
                  .filter((i) => i.macro && i.gramos)
                  .slice(0, 2)
                  .map((i) => `${formatInt(i.gramos!)} g de ${i.nombre.toLowerCase()}`)
              : []
            return (
              <li key={t.id}>
                <button type="button" class={styles.fila} onClick={() => onCocinado(t.cocinado.id)}>
                  <PlatoFoto foto={fotos.value[t.cocinado.plato] ?? null} />
                  <span class={styles.filaTexto}>
                    <span class={styles.plato}>
                      {t.hora} · Cocina {p?.nombre ?? 'el plato'}
                    </span>
                    <span class={v.foot}>
                      {t.raciones} {t.raciones === 1 ? 'ración' : 'raciones'}
                      {principales.length ? ` · ${principales.join(', ')}` : ''}
                    </span>
                  </span>
                  <ChevronRightIcon />
                </button>
              </li>
            )
          }
          const h = t.hueco
          const p = platoPorId(h.plato)
          const total = totalDelHueco(h)
          const ya = p ? platoApuntado(p.id, h.comida, hoy.value) : false
          return (
            <li key={t.id}>
              <button type="button" class={styles.fila} disabled={ya || !p} onClick={() => onApuntar(h)}>
                <PlatoFoto foto={fotos.value[h.plato] ?? null} />
                <span class={styles.filaTexto}>
                  <span class={styles.plato}>
                    {comidaDe(h.comida).nombre} · {p?.nombre ?? 'Plato'}
                  </span>
                  <span class={v.foot}>
                    {total ? `${formatInt(total.kcal)} kcal` : ''}
                    {t.yaCocinado ? ' · ya cocinado' : ''}
                  </span>
                </span>
                {ya ? <CheckIcon /> : <span class={v.foot}>Apuntar</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {deManana.length > 0 && (
        <p class={v.sub}>
          Mañana:{' '}
          {deManana
            .map(
              (h) =>
                `${comidaDe(h.comida).el}, ${platoPorId(h.plato)?.nombre.toLowerCase() ?? 'lo cocinado'}`,
            )
            .join('; ')}{' '}
          (de lo que cocinas).
        </p>
      )}
    </section>
  )
}
