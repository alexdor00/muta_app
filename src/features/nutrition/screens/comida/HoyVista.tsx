import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { CoachCard } from '../../components/CoachCard.tsx'
import { DayHero } from '../../components/DayHero.tsx'
import { MealList } from '../../components/MealList.tsx'
import { comidasHoy, hoy, objetivoHoy, pendiente, totalHoy, type ComidaId } from '../../state/comida.ts'
import styles from './Vistas.module.css'

type Props = {
  onAnadir: (comida: ComidaId) => void
  onAbrirComida: (comida: ComidaId) => void
  /** Abre la sugerencia del entrenador; null si no hay ninguna esperando. */
  onSugerencia: (() => void) | null
}

/** Hoy: lo que te queda, el aviso del entrenador (si tiene algo) y tus comidas. */
export function HoyVista({ onAnadir, onAbrirComida, onSugerencia }: Props) {
  const objetivo = objetivoHoy.value
  if (!objetivo) return null
  const total = totalHoy.value
  const sugerencia = pendiente.value
  const quedan = Math.max(0, objetivo.kcal - total.kcal)
  const faltaProteina = Math.max(0, Math.round(objetivo.protein - total.protein))
  return (
    <div class={styles.stack}>
      <DayHero
        fecha={formatDayDate(hoy.value)}
        comidas={total.kcal}
        objetivo={objetivo.kcal}
        macros={[
          { nombre: 'Proteína', hecho: total.protein, objetivo: objetivo.protein },
          { nombre: 'Hidratos', hecho: total.carbs, objetivo: objetivo.carbs },
          { nombre: 'Grasa', hecho: total.fat, objetivo: objetivo.fat },
        ]}
      />
      {sugerencia && onSugerencia && (
        <CoachCard
          titulo="El entrenador · revisión semanal"
          texto={`Te propongo un cambio: ${sugerencia.a > (sugerencia.de ?? 0) ? '+' : '−'}${formatInt(Math.abs(sugerencia.a - (sugerencia.de ?? 0)))} kcal`}
          onVer={onSugerencia}
        />
      )}
      <MealList
        comidas={comidasHoy.value.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          al: c.al,
          kcal: c.total.kcal,
          proteina: c.total.protein,
          alimentos: c.apuntes.map((a) => a.nombre).join(' · '),
        }))}
        quedan={
          quedan > 0
            ? `Te quedan ${formatInt(quedan)} kcal${faltaProteina ? ` y ${faltaProteina} g de proteína` : ''}`
            : 'Ya llegas a tu objetivo de hoy'
        }
        onAbrir={(id) => onAbrirComida(id as ComidaId)}
        onAnadir={(id) => onAnadir(id as ComidaId)}
      />
    </div>
  )
}
