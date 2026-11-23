// Una cosa que hacer hoy (pestaña Hoy). Cada área da las suyas por su index.ts; Hoy las junta, las ordena y las pinta.

export type IconoTarea =
  | 'peso'
  | 'sensaciones'
  | 'entreno'
  | 'comida'
  | 'pasos'
  | 'compra'
  | 'cocinar'
  | 'taper'
  | 'consulta'
  | 'medidas'

export type TareaDeHoy = {
  id: string
  /** Su sitio en el día (ver `ORDEN_TAREA`): lo de la mañana primero; lo que lleva hora, por su hora. */
  orden: number
  icono: IconoTarea
  titulo: string
  /** Cómo se nombra en una frase («entrenar», «la compra»). */
  corta: string
  detalle: string
  hecha: boolean
  /** El texto de su botón; sin él, una flecha. */
  boton?: string
  /** A dónde lleva (enlace) o qué abre (una hoja). */
  href?: string
  onClick?: () => void
  /**
   * Hecha, la fila ya no lleva a su pantalla: se despliega con esta frase (tus comidas de hoy, cocinar).
   */
  alTerminar?: string
  /** Foto de fondo (la del entreno). */
  foto?: string
  /** Se marca a mano en Hoy (la compra, cocinar): su área no sabe cuándo está hecha. */
  aMano?: boolean
  /** El círculo hace algo de su área (apuntar tu táper): `hecha` lo dice su área. */
  alMarcar?: () => void
  /**
   * Lo que va dentro de esta, en su misma tarjeta (en Nutrición: cada comida, la compra, cocinar…). Cada una se hace y se
   * tacha sola; la de fuera queda hecha cuando ella y todas sus partes lo están.
   */
  partes?: TareaDeHoy[]
}

/**
 * Algo que el área te propone para hoy («No cocinaste el domingo: ¿la pasamos a hoy?»): no cambia nada hasta «Aplicar»;
 * «Ahora no» la quita.
 */
export type PropuestaDeHoy = {
  id: string
  titulo: string
  detalle: string
  aplicar: () => void
  ahoraNo: () => void
}

/** El orden fijo de lo que no lleva hora; lo que lleva hora va después, por su hora (`ordenDeHora`). */
export const ORDEN_TAREA = {
  peso: 10,
  sensaciones: 20,
  entreno: 30,
  comida: 40,
  pasos: 50,
  consulta: 3000,
  medidas: 3010,
} as const

/** El orden de una tarea con hora («18:00»): detrás de las fijas del día y antes de la consulta. */
export function ordenDeHora(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return 100 + (h || 0) * 60 + (m || 0)
}
