// Iconos de línea (trazo 2) que heredan el color del texto.

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M15 4l-8 8 8 8" />
    </svg>
  )
}

export function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 7h10M17 7h4M3 17h4M11 17h10" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  )
}

export function BookmarkIcon(props: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} fill={props.filled ? 'currentColor' : 'none'}>
      <path d="M6 3h12v18l-6-4.5L6 21z" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

/** «!» dentro de un círculo: información de lo que trata algo. */
export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v6" />
      <path d="M12 16.5v.01" />
    </svg>
  )
}

/** Marca de «elegido». */
export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke} stroke-width={3}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
