import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { deMasDe, type Tanda } from '../../state/autopilot.ts'
import { racionesDeMas } from '../../use-cases/autopilot.ts'
import s from './DeMas.module.css'

/**
 * Las raciones de un plato un día de cocina, a la derecha (− 3 +, con «raciones» o «+1 de más» debajo): no baja de las
 * tuyas; las de más hacen crecer la olla y la compra, tu ración no. Solo en el modo cocina (usuario, 2026-11-21).
 */
export function DeMas({ t, plato }: { t: Tanda; plato: string }) {
  const n = deMasDe(t, plato)
  const tuyas = t.huecos.filter((h) => h.plato === plato).length
  return (
    <span class={s.deMas} role="group" aria-label="Raciones">
      <span class={s.botones}>
        <button
          type="button"
          aria-label="Quitar una ración de más"
          disabled={!n}
          onClick={() => void racionesDeMas(t.fecha, plato, n - 1)}
        >
          <MinusIcon />
        </button>
        <b>{tuyas + n}</b>
        <button
          type="button"
          aria-label="Añadir una ración de más"
          onClick={() => void racionesDeMas(t.fecha, plato, n + 1)}
        >
          <PlusIcon />
        </button>
      </span>
      <small class={n ? s.mas : ''}>{n ? `+${n} de más` : tuyas === 1 ? 'ración' : 'raciones'}</small>
    </span>
  )
}
