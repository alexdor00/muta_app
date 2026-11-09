import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import {
  avisosReparto,
  LIMITES_G_KG,
  macrosObjetivo,
  type Ajustes,
  type Reparto,
} from '../../state/comida.ts'
import h from '../comun/Hojas.module.css'
import sec from './Seccion.module.css'

/** Lo que estás eligiendo: proteína y grasa en g por kilo (modo «kg») o en gramos (modo «g»). */
export type Borrador = { modo: 'kg' | 'g'; proteina: number; grasa: number }

const MODOS: { value: Borrador['modo']; label: string }[] = [
  { value: 'kg', label: 'Por kilo de peso' },
  { value: 'g', label: 'En gramos' },
]
const unDecimal = (x: number) => Math.round(x * 10) / 10
const entre = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x))

/** Cómo tienes ahora la proteína y la grasa. */
export function borradorDe(a: Ajustes): Borrador {
  const peso = a.cuerpo.pesoKg
  if (a.proteinaG == null && a.grasaG == null)
    return { modo: 'kg', proteina: a.proteinaGKg, grasa: a.grasaGKg }
  return {
    modo: 'g',
    proteina: a.proteinaG ?? Math.round(a.proteinaGKg * peso),
    grasa: a.grasaG ?? Math.round(a.grasaGKg * peso),
  }
}

/** El borrador como se guarda: por kilo, o gramos fijos (que no cambian aunque cambie tu peso). */
export function repartoDe(b: Borrador, a: Ajustes): Reparto {
  return b.modo === 'kg'
    ? { proteinaGKg: b.proteina, grasaGKg: b.grasa, proteinaG: null, grasaG: null }
    : { proteinaGKg: a.proteinaGKg, grasaGKg: a.grasaGKg, proteinaG: b.proteina, grasaG: b.grasa }
}

export const mismoReparto = (x: Borrador, y: Borrador) =>
  x.modo === y.modo && x.proteina === y.proteina && x.grasa === y.grasa

/**
 * Proteína y grasa, por kilo de tu peso o a mano en gramos; los hidratos son lo que queda de tus kcal. Debajo, lo que
 * dicen tus documentos y un aviso si te sales (no impide guardar).
 */
export function RepartoMacros({
  a,
  valor,
  onChange,
}: {
  a: Ajustes
  valor: Borrador
  onChange: (b: Borrador) => void
}) {
  const peso = a.cuerpo.pesoKg
  const m = macrosObjetivo(a.kcal, peso, repartoDe(valor, a))
  const avisos = avisosReparto(peso, m)
  const enKg = valor.modo === 'kg'
  const cambiarModo = (modo: Borrador['modo']) => {
    if (modo === valor.modo) return
    onChange(
      modo === 'g'
        ? { modo, proteina: m.protein, grasa: m.fat }
        : {
            modo,
            proteina: entre(
              unDecimal(m.protein / peso),
              LIMITES_G_KG.proteina.min,
              LIMITES_G_KG.proteina.max,
            ),
            grasa: entre(unDecimal(m.fat / peso), LIMITES_G_KG.grasa.min, LIMITES_G_KG.grasa.max),
          },
    )
  }
  const fila = (cual: 'proteina' | 'grasa', nombre: string, gramos: number) => {
    const lim = LIMITES_G_KG[cual]
    const paso = enKg ? 0.1 : 5
    const min = enKg ? lim.min : Math.round(lim.min * peso)
    const max = enKg ? lim.max : Math.round(lim.max * peso)
    const v = valor[cual]
    const poner = (x: number) =>
      onChange({ ...valor, [cual]: entre(enKg ? unDecimal(x) : Math.round(x), min, max) })
    return (
      <div class={`${h.line} ${sec.fila}`}>
        <span>
          {nombre}
          <span class={h.rowDetail}>
            {' '}
            · {enKg ? `${formatInt(gramos)} g` : `${formatDecimal(unDecimal(gramos / peso))} g/kg`}
          </span>
        </span>
        <span class={h.miniStepper}>
          <button
            type="button"
            aria-label={`Menos ${nombre.toLowerCase()}`}
            disabled={v <= min}
            onClick={() => poner(v - paso)}
          >
            <MinusIcon />
          </button>
          <b aria-live="polite">{enKg ? `${formatDecimal(v)} g/kg` : `${formatInt(v)} g`}</b>
          <button
            type="button"
            aria-label={`Más ${nombre.toLowerCase()}`}
            disabled={v >= max}
            onClick={() => poner(v + paso)}
          >
            <PlusIcon />
          </button>
        </span>
      </div>
    )
  }
  return (
    <section class={sec.card} aria-labelledby="reparto-titulo">
      <h3 id="reparto-titulo" class={sec.eti}>
        Proteína y grasa
      </h3>
      <ChoiceSegmented<Borrador['modo']>
        name="reparto-modo"
        legend="Cómo las pones"
        options={MODOS}
        value={valor.modo}
        onChange={cambiarModo}
      />
      {fila('proteina', 'Proteína', m.protein)}
      {fila('grasa', 'Grasa', m.fat)}
      <div class={`${h.line} ${sec.fila}`}>
        <span>Hidratos: lo que queda</span>
        <b>{formatInt(m.carbs)} g</b>
      </div>
      <p class={sec.nota}>
        Se recomienda proteína 1,5–2 g/kg (algo menos en definición), grasa desde 0,6 g/kg y el resto en
        hidratos.
      </p>
      {avisos.map((x) => (
        <p key={x} class={h.warn} role="status">
          {x}
        </p>
      ))}
    </section>
  )
}
