import { formatInt } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import {
  DIFERENCIA_DE_SERIE,
  DIFERENCIAS_ON_OFF,
  entrenosDeLaSemana,
  hoy,
  kcalDelDia,
  macrosObjetivo,
  objetivoDe,
  type Ajustes,
} from '../../state/comida.ts'
import h from '../comun/Hojas.module.css'

/**
 * Hidratos según el día (ON/OFF, guía de culturismo natural): con el interruptor, los días que te toca entrenar (los sabe tu
 * rutina) llevan más hidratos y los de descanso menos, con la misma media semanal: tu déficit, volumen o mantenimiento no
 * cambia. `valor`: la diferencia elegida, o null si está apagado.
 */
export function HidratosDelDia({
  a,
  valor,
  onChange,
}: {
  a: Ajustes
  valor: number | null
  onChange: (v: number | null) => void
}) {
  const n = entrenosDeLaSemana(hoy.value)
  const sin = objetivoDe(a, hoy.value, 0)
  const dia = (entreno: boolean) =>
    macrosObjetivo(kcalDelDia(sin.kcal, entreno, n, valor ?? 0), a.cuerpo.pesoKg, a)
  return (
    <section class={h.card} aria-labelledby="hidratos-dia">
      <div class={h.line}>
        <h3 id="hidratos-dia" class={h.rowTitle}>
          Hidratos según el día
        </h3>
        <Switch
          checked={valor !== null}
          label="Hidratos según el día"
          onChange={(on) => onChange(on ? DIFERENCIA_DE_SERIE : null)}
        />
      </div>
      <p class={h.rowDetail}>
        Más hidratos los días que te toca entrenar y menos los de descanso. Tus kcal de la semana son las
        mismas: tu objetivo no cambia.
      </p>
      {valor !== null && (
        <>
          <ChoiceSegmented<string>
            name="diferencia-on-off"
            legend="Diferencia entre un día de entreno y uno de descanso"
            showLegend
            options={DIFERENCIAS_ON_OFF.map((d) => ({
              value: String(d),
              label: `${Math.round(d * 100)} %${d === DIFERENCIA_DE_SERIE ? ' (sugerido)' : ''}`,
            }))}
            value={String(valor)}
            onChange={(v) => onChange(Number(v))}
          />
          {n <= 0 || n >= 7 ? (
            <p class={h.rowDetail}>
              Esta semana no hay días de entreno y de descanso a la vez: todos los días comes igual.
            </p>
          ) : (
            [true, false].map((entreno) => (
              <div key={String(entreno)} class={h.line}>
                <span>{entreno ? `Días de entreno (${n})` : `Días de descanso (${7 - n})`}</span>
                <b>
                  {formatInt(dia(entreno).kcal)} kcal · {formatInt(dia(entreno).carbs)} g hidratos
                </b>
              </div>
            ))
          )}
        </>
      )}
    </section>
  )
}
