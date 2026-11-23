import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import { InfoIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { TargetHero } from '../../components/TargetHero.tsx'
import { ComoSeCalcula } from './ComoSeCalcula.tsx'
import styles from './Objetivo.module.css'
import { ajustes, FASES, hoy, notaHidratos, objetivoDe } from '../../state/comida.ts'
import { recargaDeHoy } from '../../state/entrenador.ts'
import { macrosCon } from '../../use-cases/target.ts'

/** Tu objetivo en la tarjeta negra (fase, kcal y macros), con los botones que se le pasen. La usan Tu plan y Tu objetivo. */
export function TarjetaObjetivo({ children }: { children?: ComponentChildren }) {
  const [calculo, setCalculo] = useState(false)
  const a = ajustes.value
  // En una recarga, hoy que entrenas: las cifras de hoy (usuario, 2026-11-22); la nota dice las de siempre
  const recarga = a && recargaDeHoy.value?.entrena ? objetivoDe(a, hoy.value) : null
  const macros = recarga ?? (a ? macrosCon(a.kcal) : null)
  if (!a || !macros) return null
  const nombreFase = FASES.find((f) => f.id === a.fase)?.nombre ?? a.fase
  const etiqueta = a.aMano
    ? `${nombreFase} · fijado a mano`
    : a.fase === 'definicion'
      ? `${nombreFase} · −${formatDecimal(a.ritmo)} % por semana`
      : nombreFase
  return (
    <TargetHero
      etiqueta={etiqueta}
      kcal={recarga?.kcal ?? a.kcal}
      cuando={recarga ? 'hoy' : a.desde > hoy.value ? 'desde mañana' : 'al día'}
      macros={{ proteina: macros.protein, hidratos: macros.carbs, grasa: macros.fat }}
      detalle={
        [notaHidratos(hoy.value), recarga ? `De siempre: ${formatInt(a.kcal)} kcal al día.` : null]
          .filter(Boolean)
          .join(' ') || undefined
      }
      info={
        a.aMano ? undefined : (
          <button
            type="button"
            class={styles.info}
            aria-label="Cómo se calcula"
            onClick={() => setCalculo(true)}
          >
            <InfoIcon />
          </button>
        )
      }
    >
      {children}
      {calculo && (
        <Sheet title="Cómo se calcula" onClose={() => setCalculo(false)}>
          <ComoSeCalcula />
        </Sheet>
      )}
    </TargetHero>
  )
}
