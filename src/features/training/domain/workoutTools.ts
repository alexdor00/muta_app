// Herramientas de la sesión del prototipo anterior: calculadora de discos (C14) y cronómetro de cadencia (C16).

/** Discos de un gimnasio normal, de mayor a menor (kg). */
const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25] as const

/**
 * Discos que van a cada lado de la barra para llegar al peso total, de mayor a menor. Lo que no se puede poner con
 * estos discos sale en `sobra` (por lado).
 */
export function discosPorLado(total: number, barra: number): { discos: number[]; sobra: number } {
  let lado = Math.max(0, (total - barra) / 2)
  const discos: number[] = []
  for (const d of DISCOS) {
    while (lado + 1e-9 >= d) {
      discos.push(d)
      lado -= d
    }
  }
  return { discos, sobra: Math.round(lado * 100) / 100 }
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
