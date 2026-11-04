// La imagen para compartir el resumen (C25): qué textos lleva. El dibujo, en use-cases/shareImage.ts.

import { formatChange, formatDecimal, formatTons } from '../../../shared/lib/format.ts'
import type { SerieHecha } from './workoutSet.ts'

export type TarjetaCompartir = {
  fecha: string
  nombre: string
  /** «Sesión completada · 12 días de racha». */
  linea: string
  cifras: { valor: string; unidad: string; nombre: string }[]
  /** «3 récords nuevos» (o null sin récords). */
  tituloRecords: string | null
  /** Hasta tres, con su mejor serie y cuánto sube. */
  records: { nombre: string; detalle: string }[]
}

/** Cuántos récords caben en la imagen; el resto se cuenta en el título. */
const MAX_RECORDS = 3

const serie = (s: SerieHecha) => (s.kg ? `${formatDecimal(s.kg)} × ${s.reps}` : `${s.reps} reps`)

/** Los textos de la imagen a partir del resumen de la sesión. */
export function tarjetaCompartir(r: {
  fecha: string
  nombre: string
  racha: number
  volumenKg: number
  series: number
  minutos: number
  records: { nombre: string; mejor: SerieHecha; cambio: number | null }[]
}): TarjetaCompartir {
  const n = r.records.length
  return {
    fecha: r.fecha,
    nombre: r.nombre,
    linea: r.racha > 1 ? `Sesión completada · ${r.racha} días de racha` : 'Sesión completada',
    cifras: [
      ...(r.volumenKg > 0
        ? [{ valor: formatTons(r.volumenKg / 1000).replace(' t', ''), unidad: 't', nombre: 'Volumen' }]
        : []),
      { valor: String(r.series), unidad: '', nombre: 'Series' },
      { valor: String(r.minutos), unidad: 'min', nombre: 'Duración' },
    ],
    tituloRecords: n ? `${n} ${n === 1 ? 'récord nuevo' : 'récords nuevos'}` : null,
    records: r.records.slice(0, MAX_RECORDS).map((x) => ({
      nombre: x.nombre,
      detalle: x.cambio ? `${serie(x.mejor)} · ${formatChange(x.cambio, 1)}` : serie(x.mejor),
    })),
  }
}
