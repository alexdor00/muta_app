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

/** Flecha hacia abajo de lo que se despliega. */
export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M9 4l8 8-8 8" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </svg>
  )
}

export function ForkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17 21V3c-2.2 1.6-3 4.2-3 8h3" />
    </svg>
  )
}

export function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.6 14.9A8.6 8.6 0 0 1 9.1 3.4a8.6 8.6 0 1 0 11.5 11.5z" />
      <path d="M16.6 2.6l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
      <path d="M20.3 8.2l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />
    </svg>
  )
}

/** Silueta de cuerpo: cobertura muscular. */
export function BodyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="5" r="2" />
      <path d="M5 9.5h14M12 9.5V15M9 21l3-6 3 6" />
    </svg>
  )
}

export function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </svg>
  )
}

export function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
    </svg>
  )
}

/** Mano que toca: «toca un músculo». */
export function TouchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V8.5a1.5 1.5 0 0 1 3 0V11m0 0v-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.5-1.5L9 15" />
    </svg>
  )
}

export function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M20 12H5M11 5l-7 7 7 7" />
    </svg>
  )
}
