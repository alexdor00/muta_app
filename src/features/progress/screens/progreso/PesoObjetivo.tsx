import { formatDecimal } from '../../../../shared/lib/format.ts'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { ajustesCuerpo, comida, pesoActual } from '../../state/progreso.ts'
import { elegirPesoObjetivo } from '../../use-cases/progress.ts'
import styles from './Progreso.module.css'

/** De medio en medio kilo. */
const PASO = 0.5

/**
 * Tu peso objetivo en volumen (usuario, 2026-11-24): al llegar, tu premio con tu antes y después. Como la grasa objetivo
 * en definición; solo sale en volumen (lo dice tu fase de Nutrición). 02-reglas § 8 ya usa un peso objetivo.
 */
export function PesoObjetivo({ avisar }: { avisar: (texto: string) => void }) {
  const peso = pesoActual.value
  if (comida.value?.fase !== 'volumen' || !peso) return null
  const objetivo = ajustesCuerpo.value.pesoObjetivo ?? null
  const poner = (kg: number) => {
    const v = Math.round(kg / PASO) * PASO
    void elegirPesoObjetivo(v)
    avisar(`Tu peso objetivo: ${formatDecimal(v)} kg`)
  }
  return (
    <>
      <h3 class={styles.subtitulo}>Tu peso objetivo</h3>
      {objetivo === null ? (
        <button type="button" class={styles.accion} onClick={() => poner(peso + 2)}>
          <PlusIcon /> Poner tu peso objetivo
        </button>
      ) : (
        <>
          <div class={styles.pasos}>
            <RoundButton label="Medio kilo menos" variant="plain" onClick={() => poner(objetivo - PASO)}>
              <MinusIcon />
            </RoundButton>
            <b aria-live="polite">{formatDecimal(objetivo)} kg</b>
            <RoundButton label="Medio kilo más" variant="plain" onClick={() => poner(objetivo + PASO)}>
              <PlusIcon />
            </RoundButton>
          </div>
          <p class={styles.sub}>
            {peso >= objetivo
              ? 'Ya estás en tu peso objetivo.'
              : `Te faltan ${formatDecimal(Math.round((objetivo - peso) * 10) / 10)} kg. Al llegar, tu premio.`}
          </p>
        </>
      )}
    </>
  )
}
