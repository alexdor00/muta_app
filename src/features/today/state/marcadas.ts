// Lo que marcas a mano en Hoy (la compra, cocinar: su área no sabe cuándo lo has hecho), por día. Lo guarda
// use-cases/marcadas.ts; aquí no se guarda nada.
import { signal } from '@preact/signals'

/** Por día (AAAA-MM-DD), los id de lo que marcaste. */
export const marcadas = signal<Record<string, string[]>>({})
