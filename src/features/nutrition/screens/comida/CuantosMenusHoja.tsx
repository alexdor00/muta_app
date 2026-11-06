import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { MAX_MENUS, menu, NOMBRE_DIA } from '../../state/recetas.ts'
import { cuantosMenus, menuEnDia, repartoDeMenus } from '../../use-cases/menu.ts'
import h from '../comun/Hojas.module.css'
import styles from './Menu.module.css'

/** Cuántos menús (1 a 7) y qué día va cada uno: seguidos (A B C A B C A) o elegidos por ti. */
export function CuantosMenusHoja({ onClose }: { onClose: () => void }) {
  const m = menu.value
  const n = m.menus.length
  const siguiente = (actual: string) => m.menus[(m.menus.findIndex((x) => x.id === actual) + 1) % n].id
  return (
    <Sheet
      title="Tus menús"
      onClose={onClose}
      footer={
        <div class={h.actions}>
          <Button onClick={onClose}>Listo</Button>
        </div>
      }
    >
      <div class={h.stack}>
        <div class={h.line}>
          <span>Cuántos</span>
          <span class={h.miniStepper}>
            <button
              type="button"
              aria-label="Un menú menos"
              disabled={n <= 1}
              onClick={() => void cuantosMenus(n - 1)}
            >
              <MinusIcon />
            </button>
            <b>{n}</b>
            <button
              type="button"
              aria-label="Un menú más"
              disabled={n >= MAX_MENUS}
              onClick={() => void cuantosMenus(n + 1)}
            >
              <PlusIcon />
            </button>
          </span>
        </div>
        <ChoiceSegmented<'seguidos' | 'elegidos'>
          name="reparto-menus"
          legend="Qué día va cada uno"
          showLegend
          options={[
            { value: 'seguidos', label: 'Seguidos' },
            { value: 'elegidos', label: 'Yo elijo' },
          ]}
          value={m.reparto}
          onChange={(r) => void repartoDeMenus(r)}
        />
        <ol class={styles.dias}>
          {NOMBRE_DIA.map((d, i) => (
            <li key={d}>
              <span class={styles.diaNombre}>{d}</span>
              <button
                type="button"
                class={`${styles.letra} ${styles.letraHoja}`}
                aria-label={`${d}: menú ${m.semana[i]}, cambiar`}
                disabled={n < 2}
                onClick={() => void menuEnDia(i, siguiente(m.semana[i]))}
              >
                {m.semana[i]}
              </button>
            </li>
          ))}
        </ol>
        <p class={h.foot}>
          Toca un día para cambiar su menú. Los días de entreno y de descanso comen el mismo menú, cada uno
          con sus gramos.
        </p>
      </div>
    </Sheet>
  )
}
