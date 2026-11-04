// Los consejos de antes de empezar que ocultaste en «Consejos de hoy». Los carga y guarda use-cases/myTips.ts.
import { signal } from '@preact/signals'
import { SIN_AJUSTES, type AjustesConsejos } from '../domain/myTips.ts'

export const ajustesConsejos = signal<AjustesConsejos>(SIN_AJUSTES)
