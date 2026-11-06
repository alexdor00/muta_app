import { useState } from 'preact/hooks'
import { addDays, formatDayDate } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import { hoy } from '../../state/comida.ts'
import { menu } from '../../state/recetas.ts'
import { alCalendario, cambiarAvisos, diaDeCompra, sinDiaDeCompra } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/**
 * Tus avisos: el día de la compra, qué quieres que te avise y cuánto antes. La app no tiene servidor y no puede sonar a
 * una hora con el móvil bloqueado: las horas pasan al calendario del móvil (que sí avisa); al abrir MUTA, lo de hoy está
 * arriba.
 */
export function AvisosHoja({ onClose, avisar }: Props) {
  const m = menu.value
  const a = m.avisos
  const [compraFecha, setCompraFecha] = useState(m.compraEl?.fecha ?? '')
  const [compraHora, setCompraHora] = useState(m.compraEl?.hora ?? '11:00')
  const dias = Array.from({ length: 7 }, (_, i) => addDays(hoy.value, i))
  const guardarCompra = (f: string, hora: string) => (f ? diaDeCompra(f, hora) : sinDiaDeCompra())
  return (
    <Sheet
      title="Tus avisos"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              const r = await alCalendario()
              if (r === 'none') return avisar('No se pudo pasar al calendario')
              onClose()
              avisar(
                r === 'shared'
                  ? 'Ábrelo con tu calendario para añadir los avisos'
                  : 'Guardado: ábrelo con tu calendario',
              )
            }}
          >
            Añadir la semana al calendario
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <ChoiceChips<string>
          name="dia-compra"
          legend="Día de la compra"
          showLegend
          options={[
            { value: '', label: 'Ninguno' },
            ...dias.map((d) => ({ value: d, label: d === hoy.value ? 'Hoy' : formatDayDate(d) })),
          ]}
          value={compraFecha}
          onChange={(f) => {
            setCompraFecha(f)
            void guardarCompra(f, compraHora)
          }}
        />
        {compraFecha && (
          <label class={h.field}>
            <span class={h.foot}>Hora de la compra</span>
            <input
              type="time"
              value={compraHora}
              onInput={(e) => {
                const v = e.currentTarget.value
                if (!v) return
                setCompraHora(v)
                void guardarCompra(compraFecha, v)
              }}
            />
          </label>
        )}
        {(
          [
            ['cocinar', 'Cocinar'],
            ['compra', 'La compra'],
            ['comidas', 'Cada comida (horas sugeridas: 8:00, 14:00, 17:30 y 21:00)'],
          ] as const
        ).map(([k, texto]) => (
          <div key={k} class={h.line}>
            <span>{texto}</span>
            <Switch label={texto} checked={a[k]} onChange={(on) => void cambiarAvisos({ [k]: on })} />
          </div>
        ))}
        <ChoiceSegmented<string>
          name="avisos-antes"
          legend="Cuánto antes"
          showLegend
          options={['15', '30', '60'].map((x) => ({ value: x, label: `${x} min` }))}
          value={String(a.antesMin)}
          onChange={(x) => void cambiarAvisos({ antesMin: Number(x) })}
        />
        <p class={h.foot}>
          La app no puede sonar a una hora con el móvil bloqueado (no tiene servidor). Lo fiable es tu
          calendario: pasa los próximos 7 días con su alarma. Si cambias el menú, vuelve a pasarlo.
        </p>
      </div>
    </Sheet>
  )
}
