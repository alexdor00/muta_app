import { useState } from 'preact/hooks'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, RITMOS, type Fase } from '../../state/comida.ts'
import { cambiarFase } from '../../use-cases/target.ts'
import { QUE_QUIERES } from '../comida/DatosHoja.tsx'
import h from '../comun/Hojas.module.css'

/**
 * Editar tu objetivo, con nombres que dicen lo que hacen: qué quieres (definir, mantenerte o volumen) y a qué velocidad
 * se guardan aquí; «Poner mis kcal», «Cómo se calcula» y «Mis datos» llevan a Tu objetivo.
 */
export function EditarObjetivoHoja({ onClose }: { onClose: () => void }) {
  const a = ajustes.value
  const [fase, setFase] = useState<Fase>(a?.fase ?? 'mantenimiento')
  const [ritmo, setRitmo] = useState(String(a?.ritmo ?? 0.75))
  if (!a) return null
  const cambia = fase !== a.fase || (fase === 'definicion' && Number(ritmo) !== a.ritmo)
  const fila = (href: string, nombre: string, detalle: string) => (
    <li class={h.row}>
      <a class={h.rowMain} href={href}>
        <span class={h.rowTitle}>{nombre}</span>
        <span class={h.rowDetail}>{detalle}</span>
      </a>
      <ChevronRightIcon />
    </li>
  )
  return (
    <Sheet
      title="Tu objetivo"
      onClose={onClose}
      large
      footer={
        cambia && (
          <Button
            onClick={async () => {
              await cambiarFase(fase, Number(ritmo))
              onClose()
            }}
          >
            Guardar y recalcular
          </Button>
        )
      }
    >
      <div class={h.stack}>
        <ChoiceSegmented<Fase>
          name="editar-que-quieres"
          legend="¿Qué quieres?"
          showLegend
          options={QUE_QUIERES}
          value={fase}
          onChange={setFase}
        />
        {fase === 'definicion' && (
          <ChoiceSegmented<string>
            name="editar-velocidad"
            legend="Velocidad: de tu peso por semana"
            showLegend
            options={RITMOS.map((r) => ({ value: String(r), label: `−${formatDecimal(r)} %` }))}
            value={ritmo}
            onChange={setRitmo}
          />
        )}
        <ul class={h.list}>
          {fila(
            `${paths.nutritionTarget}?hoja=mano`,
            'Poner mis kcal',
            'Si tu nutricionista te da otra cifra',
          )}
          {fila(
            paths.nutritionTarget,
            'Cómo se calcula',
            'Tu gasto, tu actividad, la revisión semanal y el historial',
          )}
          {fila(
            `${paths.nutritionTarget}?hoja=datos`,
            'Mis datos',
            `${formatDecimal(a.cuerpo.pesoKg)} kg · ${a.cuerpo.alturaCm} cm · ${a.cuerpo.edad} años · ${formatInt(a.pasos)} pasos`,
          )}
        </ul>
      </div>
    </Sheet>
  )
}
