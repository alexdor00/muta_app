// Tu material: lo que te falta (vacío: lo tienes todo). Lo carga y guarda use-cases/myEquipment.ts.
import { signal } from '@preact/signals'
import type { Equipment } from '../domain/exerciseLibrary.ts'

export const materialQueFalta = signal<Equipment[]>([])

export { MATERIALES } from '../domain/equipment.ts'
