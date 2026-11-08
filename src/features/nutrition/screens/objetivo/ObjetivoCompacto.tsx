import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { ajustes, FASES } from '../../state/comida.ts'
import { macrosCon } from '../../use-cases/target.ts'
import styles from './ObjetivoCompacto.module.css'

/** Tu objetivo en pequeño (Tu plan): la fase, las kcal al día, los gramos de cada macro y «Editar». */
export function ObjetivoCompacto({ onEditar }: { onEditar: () => void }) {
  const a = ajustes.value
  const m = a ? macrosCon(a.kcal) : null
  if (!a || !m) return null
  const fase = FASES.find((f) => f.id === a.fase)?.nombre ?? a.fase
  const detalle = a.aMano
    ? 'tus kcal'
    : a.fase === 'definicion'
      ? `−${formatDecimal(a.ritmo)} %/semana`
      : null
  return (
    <section class={styles.card} aria-label="Tu objetivo">
      <div class={styles.arriba}>
        <div>
          <h2 class={styles.eti}>
            {fase}
            {detalle ? ` · ${detalle}` : ''}
          </h2>
          <p class={styles.kcal}>
            <b>{formatInt(a.kcal)}</b> kcal al día
          </p>
        </div>
        <button type="button" class={styles.editar} onClick={onEditar}>
          Editar
        </button>
      </div>
      <ul class={styles.macros}>
        {[
          [m.protein, 'proteína'],
          [m.carbs, 'hidratos'],
          [m.fat, 'grasa'],
        ].map(([g, nombre]) => (
          <li key={nombre}>
            <b>{formatInt(g as number)} g</b>
            <span>{nombre}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
