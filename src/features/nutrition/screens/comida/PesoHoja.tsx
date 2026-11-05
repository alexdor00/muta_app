import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { hoy, pesajes } from '../../state/comida.ts'
import { apuntarPeso } from '../../use-cases/nutritionStore.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/** Tu peso de hoy. Hasta que exista la pestaña Hoy, se apunta aquí. */
export function PesoHoja({ onClose, avisar }: Props) {
  const ultimo = [...pesajes.value].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const deHoy = pesajes.value.find((p) => p.date === hoy.value)
  const [texto, setTexto] = useState(deHoy || ultimo ? formatDecimal((deHoy ?? ultimo)?.kg ?? 0) : '')

  async function guardar() {
    const kg = parseDecimal(texto)
    if (kg === null || kg < 30 || kg > 300) return avisar('Escribe tu peso en kilos (entre 30 y 300)')
    await apuntarPeso(Math.round(kg * 10) / 10)
    onClose()
    avisar(`${formatDecimal(kg)} kg apuntados`)
  }

  return (
    <Sheet
      title="Tu peso de hoy"
      onClose={onClose}
      large
      footer={<Button onClick={() => void guardar()}>Guardar</Button>}
    >
      <div class={h.stack}>
        <p class={h.sub}>
          En ayunas, después de ir al baño y con la misma ropa: así los días se comparan entre sí.
        </p>
        <label class={h.amount}>
          <input
            inputMode="decimal"
            aria-label="Peso en kilos"
            value={texto}
            placeholder="80,0"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
          <span class={h.sub}>kg</span>
        </label>
      </div>
    </Sheet>
  )
}
