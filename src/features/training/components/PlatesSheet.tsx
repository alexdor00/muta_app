import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
// Comparte los estilos con las demás hojas de la sesión
import styles from './WorkoutSheets.module.css'

const BARRAS = [
  { value: '20', label: '20 kg' },
  { value: '15', label: '15 kg' },
  { value: '10', label: '10 kg' },
  { value: '0', label: 'Sin barra' },
] as const

/** Calculadora de discos (C14): peso total, barra y los discos de cada lado dibujados sobre la barra. */
export function PlatesSheet(props: {
  total: string
  onTotal: (total: string) => void
  barra: (typeof BARRAS)[number]['value']
  onBarra: (barra: (typeof BARRAS)[number]['value']) => void
  discos: number[]
  /** «20 + 1,25». */
  porLado: string
  sobra: string | null
  onClose: () => void
}) {
  return (
    <Sheet title="Discos por lado" onClose={props.onClose} large>
      <label class={styles.label} for="peso-total">
        Peso total
      </label>
      <input
        id="peso-total"
        class={styles.total}
        inputMode="decimal"
        value={props.total}
        onInput={(e) => props.onTotal(e.currentTarget.value)}
      />
      <p class={styles.label}>Barra</p>
      <div class={styles.bars}>
        <ChoiceSegmented
          name="barra"
          legend="Barra"
          options={[...BARRAS]}
          value={props.barra}
          onChange={props.onBarra}
        />
      </div>
      <div class={styles.barbell} aria-hidden="true">
        <span class={styles.sleeve} />
        {props.discos.map((d, i) => (
          <span key={i} class={styles.plate} data-kg={String(d)}>
            {String(d).replace('.', ',')}
          </span>
        ))}
        <span class={styles.collar} />
        <span class={styles.end} />
      </div>
      <p class={styles.perSide}>
        Por lado: <b>{props.porLado || 'nada'}</b>
        {props.sobra && <span class={styles.lead}> (faltan {props.sobra} kg por lado con estos discos)</span>}
      </p>
    </Sheet>
  )
}
