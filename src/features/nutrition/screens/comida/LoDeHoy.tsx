import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronRightIcon, ClockIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { fotos, gramosDeHueco, menu, paraCocinar, platoPorId, tareasDeHoy } from '../../state/recetas.ts'
import styles from './Menu.module.css'
import v from './Vistas.module.css'

/** Lo de hoy con hora, de tu menú: la compra y lo que cocinas (con los gramos de lo principal). */
export function LoDeHoy({ onCocinado }: { onCocinado: (id: string) => void }) {
  const tareas = tareasDeHoy.value
  if (!tareas.length) return null
  return (
    <section class={v.card} aria-labelledby="lo-de-hoy">
      <h2 id="lo-de-hoy" class={styles.diaTitulo}>
        Lo de hoy
      </h2>
      <ul class={styles.filas}>
        {tareas.map((t) => {
          if (t.tipo === 'compra')
            return (
              <li key={t.id}>
                <a class={styles.fila} href={paths.shopping}>
                  <span class={styles.mas} aria-hidden="true">
                    <ClockIcon />
                  </span>
                  <span class={styles.filaTexto}>
                    <span class={styles.plato}>{t.hora} · Haz la compra</span>
                  </span>
                  <ChevronRightIcon />
                </a>
              </li>
            )
          const p = platoPorId(t.cocinado.plato)
          const principales = p
            ? paraCocinar(menu.value, t.cocinado, p, gramosDeHueco)
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
        })}
      </ul>
    </section>
  )
}
