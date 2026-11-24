// Tu copia de seguridad (usuario, 2026-11-24; Desktop/MUTA-Copia-de-seguridad-propuesta.png): cuándo fue la última y si
// toca recordarla en Hoy (cada mes; sin ninguna, a la semana de empezar; «Ahora no», otro mes). Lo carga use-cases/copia.ts.
import { signal } from '@preact/signals'

export const copia = signal<{ ultima: string | null; toca: boolean } | null>(null)
