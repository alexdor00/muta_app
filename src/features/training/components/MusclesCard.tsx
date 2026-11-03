import { useRef, useState } from 'preact/hooks'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { TouchIcon } from '../../../shared/ui/icons.tsx'
import { MuscleFigure, musclesOfPart, partName } from './MuscleFigure.tsx'
import styles from './MusclesCard.module.css'

const PERIODOS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
] as const
const LADOS = [
  { value: 'front', label: 'Frente' },
  { value: 'back', label: 'Espalda' },
] as const

type Props = {
  periodo: 'hoy' | 'semana'
  onPeriodo: (periodo: 'hoy' | 'semana') => void
  lado: 'front' | 'back'
  onLado: (lado: 'front' | 'back') => void
  /** Pieza del dibujo tocada, o null. */
  musculo: string | null
  onMusculo: (part: string | null) => void
  musculos: number
  series: number
  /** Series de cada músculo trabajado, por su id. */
  porMusculo: Record<string, number>
  /** Nombre de cada músculo, por su id. */
  names: Record<string, string>
  /** «Ver ficha» en la burbuja: abre la del músculo tocado (en hombros, el primero trabajado). */
  onFicha: (musculo: string) => void
}

/**
 * Tarjeta «Músculos» de Tu plan: resumen, periodo, el cuerpo grande y Frente/Espalda debajo. Al tocar un músculo
 * sale encima una burbuja con sus series (como en el prototipo anterior) y «Ver ficha»; tocar fuera la cierra.
 */
export function MusclesCard({
  periodo,
  onPeriodo,
  lado,
  onLado,
  musculo,
  onMusculo,
  musculos,
  series,
  porMusculo,
  names,
  onFicha,
}: Props) {
  const cuando = periodo === 'hoy' ? 'hoy' : 'esta semana'
  const ids = musculo ? musclesOfPart(musculo) : []
  const trabajados = ids.filter((id) => (porMusculo[id] ?? 0) > 0)
  const nombre = musculo ? partName(musculo, names) : ''
  const detalle = trabajados.length
    ? trabajados
        .map((id) => `${ids.length > 1 ? `${names[id] ?? id}: ` : ''}${porMusculo[id]} series ${cuando}`)
        .join(' · ')
    : `Sin series ${cuando}`
  // Dónde va la burbuja: encima del músculo tocado, sin salirse de la tarjeta
  const figura = useRef<HTMLDivElement>(null)
  const [sitio, setSitio] = useState({ left: 0, top: 0 })
  const elegir = (part: string | null, anchor?: Element) => {
    const caja = figura.current?.getBoundingClientRect()
    const r = anchor?.getBoundingClientRect()
    // media burbuja (≈ 60 px) de margen a cada lado para que no se corte
    const medio = 60
    if (caja && r) {
      const left = Math.min(Math.max(r.left + r.width / 2 - caja.left, medio), caja.width - medio)
      setSitio({ left, top: r.top - caja.top })
    }
    onMusculo(part)
  }
  return (
    <section class={styles.card} aria-labelledby="musculos">
      <div class={styles.head}>
        <div>
          <h2 id="musculos" class={styles.eyebrow}>
            Músculos
          </h2>
          <p class={styles.summary}>
            {musculos} músculos · {series} series {cuando}
          </p>
        </div>
        <div class={styles.toggle}>
          <ChoiceSegmented
            name="periodo-plan"
            legend="Periodo"
            options={[...PERIODOS]}
            value={periodo}
            onChange={onPeriodo}
          />
        </div>
      </div>
      <div class={styles.figure} ref={figura}>
        <MuscleFigure side={lado} selected={musculo} onSelect={elegir} series={porMusculo} names={names} />
        <div class={styles.bubbleSpot} aria-live="polite">
          {musculo && (
            <div class={styles.bubble} style={{ left: `${sitio.left}px`, top: `${sitio.top}px` }}>
              <strong>{nombre}</strong>
              <span>{detalle}</span>
              <button
                type="button"
                class={styles.bubbleLink}
                onClick={() => onFicha(trabajados[0] ?? ids[0])}
              >
                Ver ficha
              </button>
            </div>
          )}
        </div>
      </div>
      <div class={styles.side}>
        <ChoiceSegmented
          name="lado-plan"
          legend="Vista"
          options={[...LADOS]}
          value={lado}
          onChange={onLado}
        />
      </div>
      <p class={styles.hint}>
        <TouchIcon />
        Toca un músculo para ver sus series
      </p>
    </section>
  )
}
