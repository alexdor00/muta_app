import type { ComponentChildren } from 'preact'
import { formatDecimal } from '../../../../shared/lib/format.ts'
import { TargetHero } from '../../components/TargetHero.tsx'
import { ajustes, FASES, hoy } from '../../state/comida.ts'
import { macrosCon } from '../../use-cases/target.ts'

/** Tu objetivo en la tarjeta negra (fase, kcal y macros), con los botones que se le pasen. La usan Tu plan y Tu objetivo. */
export function TarjetaObjetivo({ children }: { children?: ComponentChildren }) {
  const a = ajustes.value
  const macros = a ? macrosCon(a.kcal) : null
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
      kcal={a.kcal}
      cuando={a.desde > hoy.value ? 'desde mañana' : 'al día'}
      macros={{ proteina: macros.protein, hidratos: macros.carbs, grasa: macros.fat }}
    >
      {children}
    </TargetHero>
  )
}
