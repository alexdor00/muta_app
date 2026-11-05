import { useState } from 'preact/hooks'
import { parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { Alimento } from '../../state/comida.ts'
import { crearAlimento } from '../../use-cases/foodLog.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; onCreado: (a: Alimento) => void }

/** Crear un alimento con los valores por 100 g de su etiqueta; después se elige la cantidad. */
export function CrearAlimentoHoja({ onClose, onCreado }: Props) {
  const [v, setV] = useState({
    name: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    servingG: '',
    servingLabel: '',
  })
  const [error, setError] = useState<string | null>(null)
  const num = (s: string) => Math.max(0, parseDecimal(s) ?? 0)

  async function crear() {
    if (!v.name.trim() || !(num(v.kcal) > 0)) return setError('Pon al menos el nombre y las kcal')
    const nuevo = await crearAlimento({
      name: v.name.trim(),
      kcal: num(v.kcal),
      protein: num(v.protein),
      carbs: num(v.carbs),
      fat: num(v.fat),
      servingG: num(v.servingG) || 100,
      servingLabel: v.servingLabel.trim() || 'ración',
    })
    onCreado(nuevo)
  }

  const campo = (clave: keyof typeof v, etiqueta: string, numero = true, ejemplo = '', ancho = false) => (
    <label class={`${h.field} ${ancho ? h.wide : ''}`}>
      {etiqueta}
      <input
        inputMode={numero ? 'decimal' : 'text'}
        value={v[clave]}
        placeholder={ejemplo}
        onInput={(e) => setV({ ...v, [clave]: e.currentTarget.value })}
      />
    </label>
  )

  return (
    <Sheet
      title="Crear alimento"
      onClose={onClose}
      large
      footer={<Button onClick={() => void crear()}>Crear y añadir</Button>}
    >
      <div class={h.stack}>
        <p class={h.sub}>Copia los valores por 100 g de la etiqueta.</p>
        <div class={h.fields}>
          {campo('name', 'Nombre', false, 'Pan proteico', true)}
          {campo('kcal', 'Kcal / 100 g')}
          {campo('protein', 'Proteína / 100 g')}
          {campo('carbs', 'Hidratos / 100 g')}
          {campo('fat', 'Grasa / 100 g')}
          {campo('servingG', 'Ración (g)', true, '100')}
          {campo('servingLabel', 'Nombre de la ración', false, 'rebanada')}
        </div>
        {error && (
          <p class={h.warn} role="alert">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
