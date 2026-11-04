// Tus notas de cada ejercicio («Tus notas»): se guardan para siempre y salen en la sesión y en su ficha. Clave: el id de la
// biblioteca o, si no está, el nombre sin tildes (`claveNota`). Las carga y guarda use-cases/exerciseNotes.ts.
import { signal } from '@preact/signals'

export const notasEjercicio = signal<Record<string, string>>({})
