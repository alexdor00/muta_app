import { useState } from 'preact/hooks'
import { formatDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceList, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, FASES, RITMOS, type Fase } from '../../state/comida.ts'
import { cambiarFase } from '../../use-cases/target.ts'
import h from '../comun/Hojas.module.css'

/** Cambiar de fase (y el ritmo de pérdida en definición): el objetivo se recalcula con tus datos. */
export function FaseHoja({ onClose }: { onClose: () => void }) {
  const a = ajustes.value
  const [fase, setFase] = useState<Fase>(a?.fase ?? 'mantenimiento')
  const [ritmo, setRitmo] = useState(String(a?.ritmo ?? 0.75))
  if (!a) return null
  return (
    <Sheet
      title="¿Qué quieres?"
      onClose={onClose}
      large
      footer={
        <Button
          onClick={async () => {
            await cambiarFase(fase, Number(ritmo))
            onClose()
          }}
        >
          Cambiar y recalcular
        </Button>
      }
    >
      <div class={h.stack}>
        <ChoiceList<Fase>
          name="fase"
          legend="Fase"
          options={FASES.map((f) => ({ value: f.id, label: f.nombre, detail: f.detalle }))}
          value={fase}
          onChange={setFase}
        />
        {fase === 'definicion' && (
          <>
            <ChoiceSegmented<string>
              name="ritmo"
              legend="Ritmo de pérdida por semana"
              showLegend
              options={RITMOS.map((r) => ({ value: String(r), label: `${formatDecimal(r)} %` }))}
              value={ritmo}
              onChange={setRitmo}
            />
            <p class={h.sub}>
              En % de tu peso por semana. 0,75 % es el de serie; más rápido cuesta más músculo y más hambre.
            </p>
          </>
        )}
      </div>
    </Sheet>
  )
}
