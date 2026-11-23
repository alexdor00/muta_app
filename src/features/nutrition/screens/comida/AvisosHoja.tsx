import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import { menu } from '../../state/recetas.ts'
import { alCalendario, cambiarAvisos } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/**
 * Tus avisos: qué quieres que te avise (cocinar, la compra, cada comida) y cuánto antes. La app no tiene servidor y no puede sonar a
 * una hora con el móvil bloqueado: las horas pasan al calendario del móvil (que sí avisa); al abrir MUTA, lo de hoy está
 * arriba.
 */
export function AvisosHoja({ onClose, avisar }: Props) {
  const m = menu.value
  const a = m.avisos
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
        <p class={h.sub}>
          El día de la compra y cuándo cocinas se eligen en «Compra y cocina», en Tu semana. Aquí, qué quieres
          que te avise el calendario del móvil.
        </p>
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
