import type { ComponentChildren } from 'preact'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { COMIDAS, dieta } from '../../state/comida.ts'
import { estadoRecetas, menu, type ComoComes } from '../../state/recetas.ts'
import { ElegirComoComes } from './ComoComes.tsx'
import { textoRepetir } from './TiraDelMenu.tsx'
import styles from './TusMenus.module.css'

type Props = {
  onComoComes: (c: ComoComes) => void
  onNuevoMenu: () => void
  onCargar: () => void
  /** Un día de esta semana: su menú, día libre o un plato solo ese día. */
  onDia: (fecha: string) => void
  /** El menú que miras: pestañas, sus días y sus comidas (MenuVista). */
  children: ComponentChildren
}

/**
 * Tu dieta (Plan, usuario 2026-11-18): cómo se repiten tus menús (por días, con su largo, el menú de cada día y si se
 * cocina; o según el entreno), tus menús y cargar una dieta.
 */
export function TusMenusVista(props: Props) {
  // Hasta que tu menú esté leído no se pinta: un cambio antes guardaría encima uno vacío
  if (estadoRecetas.value !== 'listo') return null
  const m = menu.value
  const como = m.comoComes ?? 'repartido'
  const nombre = dieta.value?.dieta.nombre ?? 'Tus menús'

  return (
    <div class={styles.vista}>
      <section class={styles.cabeza}>
        <h2>{nombre}</h2>
        <p>
          {m.menus.length} {m.menus.length === 1 ? 'menú' : 'menús'}
          {` · ${textoRepetir()}`}
        </p>
      </section>

      {props.children}

      <ul class={styles.lista} aria-labelledby="ajustes-dieta">
        <li id="ajustes-dieta" class={styles.rotuloAjustes}>
          Ajustes de tu dieta
        </li>
        {!m.menus.every((x) => x.fijos?.length === COMIDAS.length) && (
          <ElegirComoComes valor={como} onCambiar={props.onComoComes} />
        )}
        <li class={styles.ajuste}>
          <button type="button" class={styles.fila} onClick={props.onCargar}>
            <span class={styles.texto}>
              <b>Cargar una dieta</b>
              <span>De Word, PDF o CSV, con una IA</span>
            </span>
            <ChevronRightIcon />
          </button>
        </li>
      </ul>
    </div>
  )
}
