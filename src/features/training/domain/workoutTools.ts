// Herramientas de la sesión del prototipo anterior: calculadora de discos (C14) y cronómetro de cadencia (C16).

/** Discos de un gimnasio normal, de mayor a menor (kg). En Tu material se quitan los que no hay. */
export const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25] as const

/** Todos los discos son múltiplos de este paso (kg): se cuenta en pasos para no arrastrar decimales. */
const PASO = 0.25

/**
 * Discos que van a cada lado de la barra para llegar al peso total, de mayor a menor, con los que hay (sin los de
 * `faltan`): los menos posibles y, si empatan, los más grandes. Lo que no se puede poner sale en `sobra` (por lado).
 */
export function discosPorLado(
  total: number,
  barra: number,
  faltan: readonly number[] = [],
): { discos: number[]; sobra: number } {
  const lado = Math.max(0, (total - barra) / 2)
  const hay = DISCOS.filter((d) => !faltan.includes(d)).map((d) => Math.round(d / PASO))
  const pasos = Math.floor(lado / PASO + 1e-9)
  // cuantos[u]: los menos discos que suman u pasos (Infinity si no se puede)
  const cuantos = [0]
  for (let u = 1; u <= pasos; u++) {
    cuantos[u] = Math.min(Infinity, ...hay.map((d) => (d <= u ? cuantos[u - d] + 1 : Infinity)))
  }
  let u = pasos
  while (cuantos[u] === Infinity) u--
  const sobra = Math.round((lado - u * PASO) * 100) / 100
  // De ahí, el disco más grande que deja el resto con los menos discos: salen de mayor a menor
  const discos: number[] = []
  while (u > 0) {
    const d = hay.find((x) => x <= u && cuantos[u - x] === cuantos[u] - 1)
    if (!d) break
    discos.push(d * PASO)
    u -= d
  }
  return { discos, sobra }
}

/** Cadencias del prototipo: segundos bajando, en pausa y subiendo. */
export const CADENCIAS = ['2-0-1', '3-0-1', '3-1-1', '4-0-1', '2-1-2'] as const
export type Cadencia = (typeof CADENCIAS)[number]

/**
 * En qué va una serie con cadencia a los `segundos` de empezar: repeticiones completas, la fase (baja, pausa, sube)
 * y cuánto lleva la repetición en curso (0 a 1, para el arco).
 */
export function faseCadencia(
  segundos: number,
  cadencia: Cadencia,
): { reps: number; fase: 'Baja' | 'Pausa' | 'Sube'; avance: number } {
  const [baja, pausa, sube] = cadencia.split('-').map(Number)
  const rep = baja + pausa + sube
  const reps = Math.floor(segundos / rep)
  const dentro = segundos - reps * rep
  const fase = dentro < baja ? 'Baja' : dentro < baja + pausa ? 'Pausa' : 'Sube'
  return { reps, fase, avance: dentro / rep }
}
