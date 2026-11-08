import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, KCAL_A_MANO } from '../../state/comida.ts'
import { fijarAMano, volverAlCalculo } from '../../use-cases/target.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/** Fijar las kcal a mano (si tu entrenador o tu experiencia te dicen otra cifra). La revisión semanal sigue proponiendo. */
export function ManoHoja({ onClose, avisar }: Props) {
  const a = ajustes.value
  const [texto, setTexto] = useState(a ? String(a.kcal) : '')
  if (!a) return null
  return (
    <Sheet
      title="Poner mis kcal"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              const kcal = Number(texto.replace(/\D/g, ''))
              if (!(await fijarAMano(kcal)))
                return avisar(`Entre ${formatInt(KCAL_A_MANO.min)} y ${formatInt(KCAL_A_MANO.max)} kcal`)
              onClose()
              avisar(`Objetivo fijado en ${formatInt(kcal)} kcal`)
            }}
          >
            Guardar
          </Button>
          {a.aMano && (
            <Button
              variant="secondary"
              onClick={async () => {
                await volverAlCalculo()
                onClose()
                avisar('Vuelve a salir del cálculo')
              }}
            >
              Volver al cálculo
            </Button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          Si tu nutricionista o tu experiencia te dan otra cifra. Cada semana te seguiré diciendo si conviene
          cambiarla, pero solo cambia si lo aceptas.
        </p>
        <label class={h.amount}>
          <input
            inputMode="numeric"
            aria-label="Kcal al día"
            value={texto}
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
          <span class={h.sub}>kcal al día</span>
        </label>
      </div>
    </Sheet>
  )
}
