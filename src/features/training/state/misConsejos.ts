// Tus cambios a los consejos de antes de empezar («Mis consejos»). Los carga y guarda use-cases/myTips.ts, que también
// los aplica a los consejos de MUTA.
import { signal } from '@preact/signals'
import { SIN_AJUSTES, type AjustesConsejos } from '../domain/myTips.ts'

export const ajustesConsejos = signal<AjustesConsejos>(SIN_AJUSTES)
