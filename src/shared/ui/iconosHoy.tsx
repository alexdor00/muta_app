// Iconos de las cosas de Hoy (pésate, pasos, la compra, cocinar, tu táper, un récord) y alguno más (copiar), con el mismo
// trazo que los de icons.tsx (que no pasa de 400 líneas).

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

/** Báscula: pésate (Hoy). */
export function ScaleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 9a5 5 0 0 1 8 0l-3 3" />
    </svg>
  )
}

/** Huellas: tus pasos (Hoy). */
export function StepsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M7 15c-1.5 0-2.5-1.5-2.5-4S5.5 5 7.5 5 10 7.5 10 10s-1 5-3 5z" />
      <path d="M5.5 18.5h3.5" />
      <path d="M16.5 19c-2 0-3-2.5-3-5s.5-5 2.5-5 3 3 3 5.5-1 4.5-2.5 4.5z" />
      <path d="M14 22h4" />
    </svg>
  )
}

/** Carro: la compra (Hoy). */
export function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
      <circle cx="9" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  )
}

/** Olla: cocinar (Hoy). */
export function PotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M2 10h2M20 10h2M9 6.5c0-1 1-1.5 1-2.5M14 6.5c0-1 1-1.5 1-2.5" />
    </svg>
  )
}

/** Táper: una comida de tu tanda (Hoy). */
export function TaperIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="3" y="9" width="18" height="11" rx="2.5" />
      <path d="M2 9h20M8 6h8" />
    </svg>
  )
}

/** Trofeo: un récord (tu mejor marca de siempre en un ejercicio). En naranja solo el día que lo consigues. */
export function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

/** Copiar (un menú). */
export function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}
