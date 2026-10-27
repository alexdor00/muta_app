// Iconos de los objetivos de A03 (trazo de 2 px, como los del diseño).

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

export function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {/* Mancuerna inclinada: barra y dos discos a cada lado */}
      <g transform="rotate(-45 12 12)">
        <path d="M8 12h8" />
        <rect x="4.5" y="7.5" width="3.5" height="9" rx="1" />
        <rect x="16" y="7.5" width="3.5" height="9" rx="1" />
        <path d="M2.5 10v4M21.5 10v4" />
      </g>
    </svg>
  )
}

export function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M12 22c4 0 7-2.8 7-7 0-4.5-4-7-4.5-11-2.5 1.5-4 4.5-3.5 7-1-.5-2-1.5-2.5-3C6.5 10 5 12.3 5 15c0 4.2 3 7 7 7z" />
      <path d="M12 22c-1.7 0-3-1.3-3-3 0-2 1.5-3 3-5 1.5 2 3 3 3 5 0 1.7-1.3 3-3 3z" />
    </svg>
  )
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M12 20.5s-8-4.6-8-10.4C4 7.3 6.2 5 8.8 5c1.4 0 2.6.7 3.2 1.8C12.6 5.7 13.8 5 15.2 5 17.8 5 20 7.3 20 10.1c0 5.8-8 10.4-8 10.4z" />
    </svg>
  )
}
