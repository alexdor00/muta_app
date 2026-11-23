import { paths } from '../../../../shared/lib/paths.ts'
import { BookIcon, ChevronRightIcon, FileIcon, PencilIcon, SparkIcon } from '../../../../shared/ui/icons.tsx'
import { dieta } from '../../state/comida.ts'
import { menu } from '../../state/recetas.ts'
import styles from './PlanVista.module.css'

/**
 * Mi plan · 2 Menú, sin menú (usuario, 2026-11-18): tres caminos al mismo menú. Cargar tu dieta (un CSV, que revisas antes de
 * empezar), crearla tú (tus menús, comidas y gramos) o que MUTA te proponga una con recetas para tu objetivo.
 */
export function PlanVacio(props: { onProponer: () => void; onCargar: () => void; onDeDieta: () => void }) {
  return (
    <>
      <section class={styles.vacioTexto}>
        <h2>Tu menú</h2>
        <p>Lo que comes cada día con tu objetivo.</p>
      </section>
      <ul class={styles.caminos}>
        {dieta.value && (
          <li>
            <button type="button" class={styles.camino} onClick={props.onDeDieta}>
              <span class={styles.icono}>
                <BookIcon />
              </span>
              <span class={styles.caminoTexto}>
                <b>Usar mi dieta</b>
                <span>{dieta.value.dieta.nombre}: sus menús y sus días.</span>
              </span>
              <ChevronRightIcon />
            </button>
          </li>
        )}
        <li>
          <button type="button" class={styles.camino} onClick={props.onCargar}>
            <span class={styles.icono}>
              <FileIcon />
            </span>
            <span class={styles.caminoTexto}>
              <b>Cargo mi dieta</b>
              <span>Desde un CSV. Lo revisas antes de empezar.</span>
            </span>
            <ChevronRightIcon />
          </button>
        </li>
        <li>
          <a
            class={styles.camino}
            href={`${paths.nutrition}?vista=menus&menu=${menu.value.menus[0]?.id ?? 'A'}`}
          >
            <span class={styles.icono}>
              <PencilIcon />
            </span>
            <span class={styles.caminoTexto}>
              <b>La creo yo</b>
              <span>Tus menús, tus comidas y tus gramos.</span>
            </span>
            <ChevronRightIcon />
          </a>
        </li>
        <li>
          <button type="button" class={styles.camino} onClick={props.onProponer}>
            <span class={styles.icono}>
              <SparkIcon />
            </span>
            <span class={styles.caminoTexto}>
              <b>Proponme una</b>
              <span>Con recetas para tu objetivo.</span>
            </span>
            <ChevronRightIcon />
          </button>
        </li>
      </ul>
    </>
  )
}
