import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { CheckIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { hoy } from '../../state/comida.ts'
import { fotos, huecosDelDia, menu, platoPorId, totalDelHueco } from '../../state/recetas.ts'
import { platoApuntado } from '../../use-cases/recipes.ts'
import { comidaDe } from '../comun/platos.ts'
import styles from '../comida/Menu.module.css'
import v from '../comida/Vistas.module.css'

/** Lo que comes hoy según tu menú: cada plato con sus kcal y, si ya lo apuntaste, marcado. Lleva a Comida. */
export function ComesHoy() {
  const fecha = hoy.value
  const huecos = huecosDelDia(menu.value, fecha)
  if (!huecos.length) return null
  return (
    <section class={v.card} aria-labelledby="comes-hoy">
      <h2 id="comes-hoy" class={styles.diaTitulo}>
        Hoy comes
      </h2>
      <ul class={styles.filas}>
        {huecos.map((h) => {
          const p = platoPorId(h.plato, fecha)
          const total = totalDelHueco(h)
          const hecho = p ? platoApuntado(p.id, h.comida, fecha) : false
          return (
            <li key={h.comida}>
              <a class={styles.fila} href={paths.nutrition}>
                <PlatoFoto foto={fotos.value[h.plato] ?? null} />
                <span class={styles.filaTexto}>
                  <span class={v.foot}>{comidaDe(h.comida).nombre}</span>
                  <span class={styles.plato}>{p?.nombre ?? 'Plato que ya no está'}</span>
                </span>
                {hecho ? (
                  <span class={v.foot} role="img" aria-label="Apuntado">
                    <CheckIcon />
                  </span>
                ) : (
                  total && <span class={v.foot}>{formatInt(total.kcal)} kcal</span>
                )}
                <ChevronRightIcon />
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
