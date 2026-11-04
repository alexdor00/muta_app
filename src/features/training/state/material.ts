// Tu material: lo que te falta (vacío: lo tienes todo), también los discos que no hay en tu gimnasio. Lo carga y guarda
// use-cases/myEquipment.ts.
import { signal } from '@preact/signals'
import type { Equipment } from '../domain/exerciseLibrary.ts'

export const materialQueFalta = signal<Equipment[]>([])
/** Los discos (kg) que no hay; la calculadora de discos de la sesión no los usa. */
export const discosQueFaltan = signal<number[]>([])

export { MATERIALES } from '../domain/equipment.ts'
