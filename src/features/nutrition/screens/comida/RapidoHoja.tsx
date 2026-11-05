import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, type Apunte, type ComidaId } from '../../state/comida.ts'
import { anadir, apunteRapido, cambiar, devolver, quitar } from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  comida: ComidaId
  editando: Apunte | null
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const texto = (n: number | undefined) => (n ? formatDecimal(n) : '')

/** Solo kcal y proteína: para comer fuera o cuando no encuentras el alimento. Hidratos y grasa, si los sabes. */
export function RapidoHoja({ comida, editando, onClose, avisar }: Props) {
  const [nombre, setNombre] = useState(editando?.nombre ?? '')
  const [valores, setValores] = useState({
    kcal: texto(editando?.kcal),
    protein: texto(editando?.protein),
    carbs: texto(editando?.carbs),
    fat: texto(editando?.fat),
  })
  const [donde, setDonde] = useState<ComidaId>(editando?.comida ?? comida)
  const num = (s: string) => Math.max(0, parseDecimal(s) ?? 0)

  async function guardar() {
    const kcal = Math.round(num(valores.kcal))
    if (!(kcal > 0)) return avisar('Pon las calorías')
    const apunte = apunteRapido(
      nombre,
      { kcal, protein: num(valores.protein), carbs: num(valores.carbs), fat: num(valores.fat) },
      donde,
    )
    if (editando) await cambiar({ ...apunte, id: editando.id })
    else {
      const id = await anadir(apunte)
      onClose()
      return avisar(`${apunte.nombre}: ${kcal} kcal`, { label: 'Deshacer', onClick: () => void quitar([id]) })
    }
    onClose()
    avisar('Guardado')
  }

  const campo = (clave: keyof typeof valores, etiqueta: string, ejemplo: string) => (
    <label class={h.field}>
      {etiqueta}
      <input
        inputMode="decimal"
        value={valores[clave]}
        placeholder={ejemplo}
        onInput={(e) => setValores({ ...valores, [clave]: e.currentTarget.value })}
      />
    </label>
  )

  return (
    <Sheet
      title={editando ? 'Cambiar' : 'Solo kcal y proteína'}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button onClick={() => void guardar()}>Guardar</Button>
          {editando && (
            <Button
              variant="secondary"
              onClick={async () => {
                const quitados = await quitar([editando.id])
                onClose()
                avisar('Quitado', { label: 'Deshacer', onClick: () => void devolver(quitados) })
              }}
            >
              Quitar
            </Button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>
          Para comer fuera o cuando no encuentras el alimento: con las kcal y la proteína aproximadas basta.
        </p>
        <div class={h.fields}>
          <label class={`${h.field} ${h.wide}`}>
            Nombre
            <input
              value={nombre}
              placeholder="Menú del día, tapas…"
              onInput={(e) => setNombre(e.currentTarget.value)}
            />
          </label>
          {campo('kcal', 'Kcal', '600')}
          {campo('protein', 'Proteína (g)', '35')}
          {campo('carbs', 'Hidratos (g)', 'opcional')}
          {campo('fat', 'Grasa (g)', 'opcional')}
        </div>
        <ChoiceSegmented<ComidaId>
          name="comida-rapido"
          legend="Comida"
          options={COMIDAS.map((c) => ({ value: c.id, label: c.nombre }))}
          value={donde}
          onChange={setDonde}
        />
      </div>
    </Sheet>
  )
}
