import { useState } from 'preact/hooks'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { ajustes, RITMOS, type Fase } from '../../state/comida.ts'
import { cambiarFase, cambiarOnOff, cambiarReparto } from '../../use-cases/target.ts'
import { QUE_QUIERES } from '../comida/DatosHoja.tsx'
import h from '../comun/Hojas.module.css'
import { HidratosDelDia } from './HidratosDelDia.tsx'
import { borradorDe, mismoReparto, RepartoMacros, repartoDe, type Borrador } from './RepartoMacros.tsx'

/**
 * Editar tu objetivo, con nombres que dicen lo que hacen: qué quieres (definir, mantenerte o volumen) y a qué velocidad
 * se guardan aquí, y también la proteína y la grasa (por kilo o en gramos) y los hidratos según el día (ON/OFF); «Poner mis kcal», «Cómo se calcula» y «Mis datos» llevan a Tu objetivo.
 */
export function EditarObjetivoHoja({ onClose }: { onClose: () => void }) {
  const a = ajustes.value
  const [fase, setFase] = useState<Fase>(a?.fase ?? 'mantenimiento')
  const [ritmo, setRitmo] = useState(String(a?.ritmo ?? 0.75))
  const [reparto, setReparto] = useState<Borrador | null>(a ? borradorDe(a) : null)
  const [onOff, setOnOff] = useState<number | null>(a?.onOff ?? null)
  if (!a || !reparto) return null
  const cambiaFase = fase !== a.fase || (fase === 'definicion' && Number(ritmo) !== a.ritmo)
  const cambiaReparto = !mismoReparto(reparto, borradorDe(a))
  const cambiaOnOff = onOff !== (a.onOff ?? null)
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
        (cambiaFase || cambiaReparto || cambiaOnOff) && (
          <Button
            onClick={async () => {
              if (cambiaReparto) await cambiarReparto(repartoDe(reparto, a))
              if (cambiaOnOff) await cambiarOnOff(onOff)
              if (cambiaFase) await cambiarFase(fase, Number(ritmo))
              onClose()
            }}
          >
            {cambiaFase ? 'Guardar y recalcular' : 'Guardar'}
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
        <RepartoMacros a={a} valor={reparto} onChange={setReparto} />
        <HidratosDelDia a={a} valor={onOff} onChange={setOnOff} />
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
