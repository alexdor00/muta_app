import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  alimentoPorId,
  cantidadAlCambiar,
  macrosDe,
  nombreRacion,
  pasoDe,
  unidadDe,
  type ComidaId,
  type Modo,
} from '../../state/comida.ts'
import type { ExtraMenu } from '../../state/recetas.ts'
import { gramosDeExtra, quitarExtra, volverA } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import { CifrasRacion } from './CifrasRacion.tsx'
import r from './Racion.module.css'

type Props = {
  menuId: string
  comida: ComidaId
  /** Su sitio entre lo que va de más en esa comida. */
  i: number
  extra: ExtraMenu
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Un alimento que va de más en una comida de un menú (usuario, 2026-11-21: tocarlo abre su cantidad, no toda la
 * comida): «− 50 g +» en sus unidades o en gramos, lo que aporta (kcal y macros), «Guardar» y «Quitar del menú».
 */
export function ExtraCantidadHoja({ menuId, comida, i, extra, onClose, avisar }: Props) {
  const a = extra.alimentoId ? alimentoPorId(extra.alimentoId) : null
  const [modo, setModo] = useState<Modo>('gramos')
  const [cantidad, setCantidad] = useState(extra.gramos)
  const [escrito, setEscrito] = useState<string | null>(null)
  const u = a ? unidadDe(a) : 'g'
  const gramos = a && modo === 'racion' ? Math.round(cantidad * a.servingG) : Math.round(cantidad)
  const deshacer = (antes: Parameters<typeof volverA>[0]) => ({
    label: 'Deshacer',
    onClick: () => void volverA(antes),
  })
  const poner = (m: Modo) => {
    if (!a) return
    setCantidad(cantidadAlCambiar(a, cantidad, m))
    setModo(m)
    setEscrito(null)
  }
  return (
    <Sheet
      title={extra.nombre}
      onClose={onClose}
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              if (!(gramos > 0)) return avisar('Pon una cantidad')
              const antes = await gramosDeExtra(menuId, comida, i, gramos)
              onClose()
              avisar('Guardado', deshacer(antes))
            }}
          >
            Guardar
          </Button>
          <button
            type="button"
            class={h.textButton}
            onClick={async () => {
              const antes = await quitarExtra(menuId, comida, i)
              onClose()
              avisar(`Sin ${extra.nombre.toLowerCase()}`, deshacer(antes))
            }}
          >
            Quitar del menú
          </button>
        </div>
      }
    >
      <div class={h.stack}>
        <section class={r.tarjeta} aria-label="Cantidad">
          <div class={r.paso}>
            <button
              type="button"
              class={r.redondo}
              aria-label="Menos"
              onClick={() => {
                setCantidad((c) => Math.max(0, Math.round((c - pasoDe(modo, a ?? undefined)) * 100) / 100))
                setEscrito(null)
              }}
            >
              <MinusIcon />
            </button>
            <label class={r.cifra}>
              <input
                inputMode="decimal"
                aria-label="Cantidad"
                value={escrito ?? formatDecimal(cantidad)}
                onInput={(e) => {
                  setEscrito(e.currentTarget.value)
                  const n = parseDecimal(e.currentTarget.value)
                  setCantidad(n !== null && n >= 0 ? n : 0)
                }}
              />
              <span>{modo === 'gramos' || !a ? u : nombreRacion(a, cantidad).replace(/^[^ ]+ /, '')}</span>
            </label>
            <button
              type="button"
              class={r.redondo}
              aria-label="Más"
              onClick={() => {
                setCantidad((c) => Math.round((c + pasoDe(modo, a ?? undefined)) * 100) / 100)
                setEscrito(null)
              }}
            >
              <PlusIcon />
            </button>
          </div>
          {a && (
            <ChoiceSegmented
              name="modo-extra"
              legend="Cómo lo cuentas"
              options={[
                {
                  value: 'racion',
                  label: nombreRacion(a, 2)
                    .replace(/^2 /, '')
                    .replace(/^./, (l) => l.toUpperCase()),
                },
                { value: 'gramos', label: u === 'ml' ? 'Mililitros' : 'Gramos' },
              ]}
              value={modo}
              onChange={poner}
            />
          )}
        </section>
        <CifrasRacion m={macrosDe(extra, gramos)} />
      </div>
    </Sheet>
  )
}
