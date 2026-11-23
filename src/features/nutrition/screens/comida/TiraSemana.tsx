import { addDays } from '../../../../shared/lib/format.ts'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { hoy } from '../../state/comida.ts'
import { DIA_LARGO, diaSemana, LETRA_DIA, menu, menuDelDia, semanaDesde } from '../../state/recetas.ts'
import styles from './PlanVista.module.css'
import h from '../comun/Hojas.module.css'

/**
 * Esta semana, de lunes a domingo, con la letra del menú de cada día (o «—» si es libre). En Mi plan elige qué día ves;
 * en Tu dieta abre ese día para cambiarlo (usuario, 2026-11-19).
 */
export function TiraSemana(props: { dia: string | null; onElegir: (f: string) => void }) {
  const m = menu.value
  const hoyEs = hoy.value
  const semana = semanaDesde(addDays(hoyEs, -diaSemana(hoyEs)))
  const indice = (id: string) => m.menus.findIndex((x) => x.id === id)
  return (
    <div class={styles.tira} role="group" aria-label="Días de esta semana">
      {semana.map((f, i) => {
        const k = menuDelDia(m, f)
        return (
          <button
            key={f}
            type="button"
            class={styles.dia}
            aria-pressed={f === props.dia}
            onClick={() => props.onElegir(f)}
          >
            {/* Lo que se ve (L 16 A) para los ojos; para el lector, el día y su menú dichos enteros (axe: el nombre
                tiene que incluir lo visible, así que lo visible no cuenta y el nombre va en texto oculto) */}
            <span class={h.oculto}>{`${DIA_LARGO[i]} ${Number(f.slice(8))}${k ? `, ${k.nombre}` : ''}`}</span>
            <span class={styles.letra} aria-hidden="true">
              {f === hoyEs ? 'Hoy' : LETRA_DIA[i]}
            </span>
            <b aria-hidden="true">{Number(f.slice(8))}</b>
            <span aria-hidden="true">
              {m.libres?.includes(f) ? (
                <span class={styles.libre}>—</span>
              ) : (
                k && <LetraMenu id={k.id} indice={indice(k.id)} />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
