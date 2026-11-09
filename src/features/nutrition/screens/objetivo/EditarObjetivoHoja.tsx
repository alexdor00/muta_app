import { useState } from 'preact/hooks'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  ajustes,
  hoy,
  RITMO_MAX_FINAL,
  RITMOS,
  SEMANA_FINAL,
  semanaDeLaFase,
  type Fase,
  type Situacion,
} from '../../state/comida.ts'
import { cambiarFase, cambiarOnOff, cambiarReparto } from '../../use-cases/target.ts'
import { QUE_QUIERES } from '../comida/DatosHoja.tsx'
import h from '../comun/Hojas.module.css'
import { HidratosDelDia } from './HidratosDelDia.tsx'
import { TuSituacion, VelocidadPorFases } from './OpcionesDeFase.tsx'
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
  const [porFases, setPorFases] = useState(a?.porFases ?? false)
  const [situacion, setSituacion] = useState<Situacion | null>(a?.situacion ?? null)
  if (!a || !reparto) return null
  // Etapa final de la definición (ya bastante definido): no se ofrece ir más rápido de −0,75 %
  const etapaFinal =
    a.fase === 'definicion' &&
    fase === 'definicion' &&
    semanaDeLaFase(a.faseDesde ?? a.creado, hoy.value) >= SEMANA_FINAL
  const cambiaFase =
    fase !== a.fase ||
    (fase === 'definicion' && (Number(ritmo) !== a.ritmo || porFases !== (a.porFases ?? false))) ||
    (fase === 'mantenimiento' && situacion !== (a.situacion ?? null))
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
              if (cambiaFase) await cambiarFase(fase, Number(ritmo), { porFases, situacion })
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
            options={RITMOS.filter((r) => !etapaFinal || r <= RITMO_MAX_FINAL).map((r) => ({
              value: String(r),
              label: `−${formatDecimal(r)} %`,
            }))}
            value={ritmo}
            onChange={setRitmo}
          />
        )}
        {etapaFinal && (
          <p class={h.foot}>
            Estás en la etapa final: se recomienda no pasar de −{formatDecimal(RITMO_MAX_FINAL)} % para no
            perder músculo ni rendimiento.
          </p>
        )}
        {fase === 'definicion' && (
          <VelocidadPorFases ritmo={Number(ritmo)} valor={porFases} onChange={setPorFases} />
        )}
        {fase === 'mantenimiento' && <TuSituacion valor={situacion} onChange={setSituacion} />}
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
