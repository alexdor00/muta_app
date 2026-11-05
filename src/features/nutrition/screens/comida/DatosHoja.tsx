import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, cuerpoValido, type Sexo } from '../../state/comida.ts'
import { guardarDatos } from '../../use-cases/target.ts'
import h from '../comun/Hojas.module.css'

/** Tus datos: lo que necesita la fórmula del gasto. Al guardar se recalcula tu objetivo (lo pides tú). */
export function DatosHoja({ onClose }: { onClose: () => void }) {
  const a = ajustes.value
  const [sexo, setSexo] = useState<Sexo>(a?.cuerpo.sexo ?? 'hombre')
  const [v, setV] = useState({
    edad: a ? String(a.cuerpo.edad) : '',
    alturaCm: a ? String(a.cuerpo.alturaCm) : '',
    pesoKg: a ? formatDecimal(a.cuerpo.pesoKg) : '',
    pasos: a ? String(a.pasos) : '',
  })
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    const n = (s: string) => parseDecimal(s) ?? Number.NaN
    const cuerpo = {
      sexo,
      edad: Math.round(n(v.edad)),
      alturaCm: Math.round(n(v.alturaCm)),
      pesoKg: Math.round(n(v.pesoKg) * 10) / 10,
    }
    // «8.000» son ocho mil pasos, no ocho
    const pasos = Math.round(n(v.pasos.replace(/\./g, '')))
    if (!cuerpoValido(cuerpo))
      return setError('Revisa la edad (14–100), la altura en cm (120–230) y el peso en kg (30–300)')
    if (!(pasos >= 0 && pasos <= 60000))
      return setError('Escribe tus pasos de un día normal (por ejemplo, 8000)')
    await guardarDatos(cuerpo, pasos)
    onClose()
  }
  const campo = (clave: keyof typeof v, etiqueta: string, ejemplo: string) => (
    <label class={h.field}>
      {etiqueta}
      <input
        inputMode="decimal"
        value={v[clave]}
        placeholder={ejemplo}
        onInput={(e) => setV({ ...v, [clave]: e.currentTarget.value })}
      />
    </label>
  )

  return (
    <Sheet
      title="Tus datos"
      onClose={onClose}
      large
      footer={
        <Button onClick={() => void guardar()}>{a ? 'Guardar y recalcular' : 'Calcular mi objetivo'}</Button>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          Con ellos calculo lo que gastas (fórmula Mifflin-St Jeor y tu actividad). Tu fase sale de tu
          objetivo de la bienvenida y la puedes cambiar en «Tu objetivo».
        </p>
        <ChoiceSegmented<Sexo>
          name="sexo"
          legend="Sexo"
          showLegend
          options={[
            { value: 'hombre', label: 'Hombre' },
            { value: 'mujer', label: 'Mujer' },
          ]}
          value={sexo}
          onChange={setSexo}
        />
        <div class={h.fields}>
          {campo('edad', 'Edad', '30')}
          {campo('alturaCm', 'Altura (cm)', '175')}
          {campo('pesoKg', 'Peso (kg)', '75,0')}
          {campo('pasos', 'Pasos al día', '8000')}
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
