import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  alimentoPorId,
  comidasDia,
  diaVisto,
  type Alimento,
  type Apunte,
  type ComidaId,
} from '../../state/comida.ts'
import { gramosDeHueco, huecoDe, menu, platoPorId } from '../../state/recetas.ts'
import { cargarAlimentos, guardarComida, textoCantidad } from '../../use-cases/foodLog.ts'
import { platoApuntado, reapuntarPlato } from '../../use-cases/recipes.ts'
import { CambiarHoja } from '../plato/CambiarHoja.tsx'
import { PlatoDelDia } from './PlatoDelDia.tsx'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  comida: ComidaId
  onClose: () => void
  onAnadir: () => void
  onEditar: (apunte: Apunte, alimento: Alimento | null) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Una comida del día: lo apuntado (tocar para cambiar o quitar), el plato de tu menú (cambiar un ingrediente ese día),
 * «Añadir» y «★ Guardar» para repetirla otro día.
 */
export function ComidaDelDiaHoja({ comida, onClose, onAnadir, onEditar, avisar }: Props) {
  const [cual, setCual] = useState<number | null>(null)
  const c = comidasDia.value.find((x) => x.id === comida)
  if (!c) return null
  const fecha = diaVisto.value
  const hueco = huecoDe(menu.value, fecha, comida)
  const plato = hueco ? platoPorId(hueco.plato, fecha) : null
  if (cual !== null && hueco && plato)
    return (
      <CambiarHoja
        plato={plato}
        indice={cual}
        fecha={fecha}
        contexto="dia"
        onClose={() => {
          setCual(null)
          // Si ya lo habías apuntado, se vuelve a apuntar con el cambio (sus gramos y sus kcal de ese día)
          const nuevo = platoPorId(hueco.plato, fecha)
          if (nuevo && platoApuntado(nuevo.id, comida, fecha))
            void reapuntarPlato(nuevo, comida, gramosDeHueco(hueco, nuevo), fecha)
        }}
        avisar={avisar}
      />
    )
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
        {c.apuntes.length > 0 && (
          <p class={h.sub}>
            {formatInt(c.total.kcal)} kcal · {formatInt(c.total.protein)} g de proteína ·{' '}
            {formatInt(c.total.carbs)} g de hidratos · {formatInt(c.total.fat)} g de grasa
          </p>
        )}
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
        <PlatoDelDia comida={comida} fecha={fecha} onCambiar={setCual} />
      </div>
    </Sheet>
  )
}
