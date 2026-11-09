// Tu fase (definición, volumen o mantenimiento): la decides en Nutrición; Entreno solo la lee para sus avisos
// (técnicas avanzadas en definición, el entrenador). null hasta cargarla o si no hay ni objetivo ni perfil.
import { signal } from '@preact/signals'
import type { Phase } from '../../profile/index.ts'

export const faseActual = signal<Phase | null>(null)
