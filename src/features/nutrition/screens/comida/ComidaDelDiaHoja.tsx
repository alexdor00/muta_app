import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { alimentoPorId, comidasHoy, type Alimento, type Apunte, type ComidaId } from '../../state/comida.ts'
import { cargarAlimentos, guardarComida, textoCantidad } from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  comida: ComidaId
  onClose: () => void
  onAnadir: () => void
  onEditar: (apunte: Apunte, alimento: Alimento | null) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/** Una comida de hoy: lo apuntado (tocar para cambiar o quitar), «Añadir» y «★ Guardar» para repetirla otro día. */
export function ComidaDelDiaHoja({ comida, onClose, onAnadir, onEditar, avisar }: Props) {
  const c = comidasHoy.value.find((x) => x.id === comida)
  if (!c) return null
  return (
    <Sheet
      title={c.nombre}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button onClick={onAnadir}>Añadir {c.al}</Button>
          {c.apuntes.length > 0 && (
            <Button
              variant="secondary"
              onClick={async () => {
                await guardarComida(
                  c.apuntes
                    .map((a) => a.nombre)
                    .slice(0, 3)
                    .join(', '),
                  comida,
                )
                avisar('Guardada: la tienes en «Guardadas ★» al añadir')
              }}
            >
              ★ Guardar esta comida
            </Button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          {formatInt(c.total.kcal)} kcal · {formatInt(c.total.protein)} g de proteína ·{' '}
          {formatInt(c.total.carbs)} g de hidratos · {formatInt(c.total.fat)} g de grasa
        </p>
        <ul class={h.list}>
          {c.apuntes.map((a) => (
            <li key={a.id} class={h.row}>
              <button
                type="button"
                class={h.rowMain}
                onClick={async () => {
                  if (a.alimentoId) await cargarAlimentos()
                  onEditar(a, a.alimentoId ? alimentoPorId(a.alimentoId) : null)
                }}
              >
                <span class={h.rowTitle}>{a.nombre}</span>
                <span class={h.rowDetail}>
                  {[textoCantidad(a), `${formatInt(a.protein)} g prot.`].filter(Boolean).join(' · ')}
                </span>
              </button>
              <span class={h.rowKcal}>{formatInt(a.kcal)} kcal</span>
              <ChevronRightIcon />
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
