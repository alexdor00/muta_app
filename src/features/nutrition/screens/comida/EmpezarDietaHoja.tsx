import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceCircles } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { Dieta } from '../../state/dieta.ts'
import { empezar, vistaPrevia } from '../../use-cases/diet.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { dieta: Dieta; onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/** Antes de empezar una dieta: sus cifras, lo que cambia en tu objetivo y qué día del menú es hoy. Nada cambia hasta «Empezar hoy». */
export function EmpezarDietaHoja({ dieta, onClose, avisar }: Props) {
  const [dia, setDia] = useState(1)
  const v = vistaPrevia(dieta)
  return (
    <Sheet
      title="Empezar la dieta"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              await empezar(dieta, dia)
              onClose()
              avisar(`Empiezas «${dieta.nombre}»: hoy es el día ${dia} del menú`)
            }}
          >
            Empezar hoy
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          <b>{dieta.nombre}</b>
          {dieta.descripcion ? ` · ${dieta.descripcion}` : ''}
        </p>
        <div class={`${h.tiles} ${h.tres}`}>
          {[
            [String(v.menus), v.menus === 1 ? 'menú' : 'menús'],
            [String(v.recetas), v.recetas === 1 ? 'receta' : 'recetas'],
            [v.media ? formatInt(v.media) : '—', 'kcal de media'],
          ].map(([n, l]) => (
            <div key={l} class={h.tile}>
              <span class={h.tileValue}>{n}</span>
              <span class={h.foot}>{l}</span>
            </div>
          ))}
        </div>
        {v.media > 0 && (
          <section class={h.card} aria-label="Cambia tu objetivo">
            <span class={h.eyebrow}>Cambia tu objetivo</span>
            <p class={h.line}>
              <span>Media al día</span>
              {v.antes !== null && <span class={h.foot}>{formatInt(v.antes)} →</span>}
              <b>{formatInt(v.media)} kcal</b>
            </p>
            <p class={h.foot}>
              Mientras la sigas, mandan sus recetas: {formatInt(v.entreno)} kcal los días de entreno y{' '}
              {formatInt(v.descanso)} los de descanso. Tu objetivo de ahora se queda guardado: vuelves a él si
              la dejas.
            </p>
          </section>
        )}
        {dieta.ejemplo && (
          <p class={h.warn}>
            Es la dieta de ejemplo del prototipo: sirve para probar, no está pautada para ti.
          </p>
        )}
        <ChoiceCircles
          name="dia-del-menu"
          legend="¿Qué día del menú es hoy?"
          showLegend
          options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: n, label: String(n) }))}
          value={dia}
          onChange={setDia}
        />
      </div>
    </Sheet>
  )
}
