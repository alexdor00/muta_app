import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { ajustes, dieta, pendiente } from '../../state/comida.ts'
import { RevisionCard } from '../objetivo/RevisionCard.tsx'
import { TarjetaObjetivo } from '../objetivo/TarjetaObjetivo.tsx'
import { SinObjetivo } from './SinObjetivo.tsx'
import styles from './PlanVista.module.css'

/** Lo que se abre de tu objetivo, cada cosa en su sitio (usuario, 2026-11-19: «los dos botones llevan a lo mismo»). */
const ABRE = [
  { ver: 'cambiar', titulo: 'Cambiar tu objetivo', detalle: 'Qué quieres, velocidad, macros y tus datos' },
] as const

/**
 * Mi plan · 1 Objetivo (usuario, 2026-11-19: «primero planificar tu objetivo y después el menú»): tu objetivo en su
 * tarjeta y la revisión de la semana (las mismas de Tu objetivo), cambiarlo y el
 * historial. Sin objetivo, calcularlo.
 */
export function ObjetivoPaso(props: {
  onCalcular: () => void
  /** La propuesta del entrenador, si hay una por decidir. */
  onSugerencia: () => void
}) {
  if (!ajustes.value && !dieta.value) return <SinObjetivo onCalcular={props.onCalcular} />
  return (
    <>
      {ajustes.value ? (
        <>
          <TarjetaObjetivo />
          <RevisionCard
            onVer={pendiente.value ? props.onSugerencia : null}
            historial={`${paths.nutritionTarget}?ver=historial`}
          />
        </>
      ) : (
        <p class={styles.nota}>Sigues una dieta: tus kcal son las de sus recetas.</p>
      )}
      <ul class={styles.tarjeta}>
        {(ajustes.value ? ABRE : ABRE.slice(0, 1)).map((x) => (
          <li key={x.ver}>
            <a class={styles.enlaceFila} href={`${paths.nutritionTarget}?ver=${x.ver}`}>
              <span class={styles.caminoTexto}>
                <b>{x.titulo}</b>
                <span>{x.detalle}</span>
              </span>
              <ChevronRightIcon />
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
