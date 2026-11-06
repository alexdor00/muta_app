import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceList, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { dieta } from '../../state/comida.ts'
import type { Plato } from '../../state/recetas.ts'
import { restaurarReceta } from '../../use-cases/diet.ts'
import { comoEnDieta, ponerEnDieta } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { plato: Plato; onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/**
 * Pone un plato en tu dieta en lugar de una receta: eliges el menú y cuál cambia. Sus gramos de entreno y de descanso
 * salen de lo que tu dieta tenía para esa comida; la consulta semanal lo sigue ajustando como al resto.
 */
export function ADietaHoja({ plato, onClose, avisar }: Props) {
  const a = dieta.value
  const menus = a?.dieta.menus ?? []
  const [menu, setMenu] = useState(menus[0]?.id ?? '')
  const recetas = a?.dieta.recetas.filter((r) => r.menu === menu || r.menu === null) ?? []
  const [receta, setReceta] = useState(recetas[0]?.id ?? '')
  if (!a) return null
  const vista = receta ? comoEnDieta(plato, receta) : null
  return (
    <Sheet
      title={`${plato.nombre} · a tu dieta`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            disabled={!vista}
            onClick={async () => {
              if (!(await ponerEnDieta(plato, receta))) return
              onClose()
              avisar(`En tu dieta en lugar de «${vista?.receta.nombre}»`, {
                label: 'Deshacer',
                onClick: () => void restaurarReceta(receta),
              })
            }}
          >
            Poner en tu dieta
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        {menus.length > 1 && (
          <ChoiceSegmented<string>
            name="dieta-menu"
            legend="Menú"
            showLegend
            options={menus.map((m) => ({ value: m.id, label: m.nombre }))}
            value={menu}
            onChange={(m) => {
              setMenu(m)
              setReceta(a.dieta.recetas.find((r) => r.menu === m || r.menu === null)?.id ?? '')
            }}
          />
        )}
        {recetas.length ? (
          <ChoiceList<string>
            name="dieta-receta"
            legend="En lugar de"
            showLegend
            options={recetas.map((r) => ({ value: r.id, label: `${r.rotulo} · ${r.nombre}` }))}
            value={receta}
            onChange={setReceta}
          />
        ) : (
          <p class={h.sub}>Este menú aún no tiene recetas.</p>
        )}
        {vista && (
          <section class={h.card} aria-label="Así quedan sus gramos">
            <p class={h.eyebrow}>Así quedan sus gramos</p>
            {plato.ingredientes.map((i, k) =>
              i.macro && i.gramos !== null ? (
                <p key={k} class={h.line}>
                  <span>{i.nombre}</span>
                  <b>
                    {formatInt(vista.entreno.gramos[k] ?? i.gramos)} g ·{' '}
                    {formatInt(vista.descanso.gramos[k] ?? i.gramos)} en descanso
                  </b>
                </p>
              ) : null,
            )}
            <p class={h.foot}>
              Día de entreno {formatInt(vista.entreno.total.kcal)} kcal (tu dieta:{' '}
              {formatInt(vista.antes.entreno.kcal)}) · descanso {formatInt(vista.descanso.total.kcal)} kcal
              (tu dieta: {formatInt(vista.antes.descanso.kcal)}).
            </p>
          </section>
        )}
      </div>
    </Sheet>
  )
}
