import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { hoy, pasosDias } from '../../state/comida.ts'
import { apuntarPasos } from '../../use-cases/nutritionStore.ts'
import h from '../comun/Hojas.module.css'

type Props = { objetivo: number; onClose: () => void; avisar: (texto: string) => void }

/** Tus pasos de hoy: los miras en el móvil o el reloj y los escribes. */
export function PasosHoja({ objetivo, onClose, avisar }: Props) {
  const deHoy = pasosDias.value[hoy.value]
  const [texto, setTexto] = useState(deHoy ? String(deHoy) : '')

  async function guardar() {
    const pasos = Number(texto.replace(/\D/g, ''))
    if (!texto.trim() || !Number.isFinite(pasos) || pasos > 100_000)
      return avisar('Escribe tus pasos de hoy (hasta 100.000)')
    await apuntarPasos(pasos)
    onClose()
    avisar(`${formatInt(pasos)} pasos apuntados`)
  }

  return (
    <Sheet
      title="Tus pasos de hoy"
      onClose={onClose}
      large
      footer={<Button onClick={() => void guardar()}>Guardar</Button>}
    >
      <div class={h.stack}>
        <p class={h.sub}>Tu objetivo: {formatInt(objetivo)} pasos.</p>
        <label class={h.amount}>
          <input
            inputMode="numeric"
            aria-label="Pasos de hoy"
            value={texto}
            placeholder={formatInt(objetivo)}
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
          <span class={h.sub}>pasos</span>
        </label>
      </div>
    </Sheet>
  )
}
