import { formatDecimal } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import { MESETAS_PARON, ritmoDeLaSemana, SUBIDA_MESETA, type Situacion } from '../../state/comida.ts'
import s from './Seccion.module.css'

/**
 * Velocidad por fases (en definición): más rápido al principio y más suave al final. Enseña las tres etapas con la
 * velocidad que elegiste.
 */
export function VelocidadPorFases({
  ritmo,
  valor,
  onChange,
}: {
  ritmo: number
  valor: boolean
  onChange: (on: boolean) => void
}) {
  const etapas = [
    { nombre: 'Semanas 1–4', semana: 1 },
    { nombre: 'Semanas 5–8', semana: 5 },
    { nombre: 'Desde la 9', semana: 9 },
  ]
  return (
    <section class={s.card} aria-labelledby="velocidad-fases">
      <div class={s.cabecera}>
        <h3 id="velocidad-fases" class={s.eti}>
          Velocidad por fases
        </h3>
        <Switch checked={valor} label="Velocidad por fases" onChange={onChange} />
      </div>
      <p class={s.nota}>Más rápido al principio, cuando cuesta menos, y más suave al final.</p>
      {valor && (
        <>
          <ul class={`${s.cajas} ${s.tres}`}>
            {etapas.map((e) => (
              <li key={e.nombre}>
                {e.nombre}
                <b>−{formatDecimal(ritmoDeLaSemana(ritmo, e.semana))} %</b>
              </li>
            ))}
          </ul>
          <p class={s.nota}>Al pasar de etapa te propondré el nuevo objetivo.</p>
        </>
      )}
    </section>
  )
}

const SITUACIONES: { value: Situacion | 'normal'; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'paron', label: 'Tras parón' },
  { value: 'salida', label: 'Tras definir' },
]

/**
 * Tu situación (en mantenimiento): si vuelves de un parón o sales de una definición, comes lo de mantenimiento y subes
 * +200 kcal en hidratos cada vez que tu peso se estabiliza (tras un parón, dos veces y ya puedes definir).
 */
export function TuSituacion({
  valor,
  onChange,
}: {
  valor: Situacion | null
  onChange: (v: Situacion | null) => void
}) {
  return (
    <section class={s.card} aria-labelledby="tu-situacion">
      <h3 id="tu-situacion" class={s.eti}>
        Tu situación
      </h3>
      <ChoiceSegmented<Situacion | 'normal'>
        name="situacion"
        legend="Tu situación"
        options={SITUACIONES}
        value={valor ?? 'normal'}
        onChange={(v) => onChange(v === 'normal' ? null : v)}
      />
      {valor && (
        <p class={s.nota}>
          {valor === 'paron'
            ? `Se recomienda subir +${SUBIDA_MESETA} kcal en hidratos cada vez que tu peso se estabilice: tras ${MESETAS_PARON} veces, ya puedes definir. Entrena por debajo de tu volumen de antes.`
            : `Se recomienda subir +${SUBIDA_MESETA} kcal en hidratos cada vez que tu peso se estabilice, entrenando duro y con unos 10.000 pasos.`}
        </p>
      )}
    </section>
  )
}
